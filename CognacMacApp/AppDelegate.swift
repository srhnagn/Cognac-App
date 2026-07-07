import AppKit
import WebKit
import MediaPlayer

// MARK: - Custom Drag View
class CustomDragView: NSView {
    override var mouseDownCanMoveWindow: Bool { return true }
}

// MARK: - Custom Window for Dragging
class DraggableWindow: NSWindow {
    override func sendEvent(_ event: NSEvent) {
        if event.type == .leftMouseDown {
            let point = event.locationInWindow
            // Top 40 pixels, avoiding the traffic lights (left 80px)
            if point.y > self.frame.height - 40 && point.x > 80 {
                self.performDrag(with: event)
                return
            }
        }
        super.sendEvent(event)
    }
}

// MARK: - Auth Proxy Handler
// Artık JS injection kullanmadığımız için bu sınıf sadece sembolik kalıyor
final class AuthProxyHandler: NSObject, WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {}
}

class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {

    var window: DraggableWindow!
    var webView: WKWebView!
    
    var authOverlay: WKWebView?
    var authCloseBtn: NSButton?
    var authPollTimer: Timer?

    // MARK: - Lifecycle

    func applicationDidFinishLaunching(_ n: Notification) {
        buildMenu()
        buildMainWindow()
        waitForServer()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ s: NSApplication) -> Bool { false }
    func applicationSupportsSecureRestorableState(_ a: NSApplication) -> Bool { true }

    // MARK: - Server

    func waitForServer(attempts: Int = 20) {
        guard attempts > 0 else { loadMain(); return }
        let t = Process()
        t.executableURL = URL(fileURLWithPath: "/bin/bash")
        t.arguments     = ["-c", "lsof -i :5173 | grep LISTEN"]
        let p = Pipe(); t.standardOutput = p; t.standardError = Pipe()
        try? t.run(); t.waitUntilExit()
        let out = String(data: p.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
        if !out.isEmpty { DispatchQueue.main.async { self.loadMain() } }
        else { DispatchQueue.main.asyncAfter(deadline: .now() + 1) { self.waitForServer(attempts: attempts - 1) } }
    }

    // MARK: - Ana pencere

    func buildMenu() {
        let mainMenu = NSMenu()
        NSApp.mainMenu = mainMenu
        
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu()
        appMenuItem.submenu = appMenu
        appMenu.addItem(withTitle: "Cognac Hakkında", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Cognac'ı Kapat", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        
        let fileMenuItem = NSMenuItem()
        fileMenuItem.title = "Dosya"
        mainMenu.addItem(fileMenuItem)
        let fileMenu = NSMenu(title: "Dosya")
        fileMenuItem.submenu = fileMenu
        fileMenu.addItem(withTitle: "Pencereyi Kapat", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        fileMenu.addItem(NSMenuItem.separator())
        fileMenu.addItem(withTitle: "Kitaplığı Güncelle (Reload)", action: #selector(reloadApp(_:)), keyEquivalent: "r")
        
        let editMenuItem = NSMenuItem()
        editMenuItem.title = "Düzenle"
        mainMenu.addItem(editMenuItem)
        let editMenu = NSMenu(title: "Düzenle")
        editMenuItem.submenu = editMenu
        editMenu.addItem(withTitle: "Geri Al", action: Selector(("undo:")), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Yinele", action: Selector(("redo:")), keyEquivalent: "Z")
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(withTitle: "Kes", action: Selector(("cut:")), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Kopyala", action: Selector(("copy:")), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Yapıştır", action: Selector(("paste:")), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Tümünü Seç", action: Selector(("selectAll:")), keyEquivalent: "a")
    }

    func buildMainWindow() {
        let cfg = WKWebViewConfiguration()
        cfg.mediaTypesRequiringUserActionForPlayback   = []
        cfg.allowsAirPlayForMediaPlayback              = true
        cfg.preferences.javaScriptCanOpenWindowsAutomatically = true

        webView = WKWebView(frame: .zero, configuration: cfg)
        webView.navigationDelegate = self
        webView.uiDelegate         = self
        webView.allowsBackForwardNavigationGestures = false

        let bg = NSColor(calibratedRed: 0.055, green: 0.043, blue: 0.031, alpha: 1)
        window = DraggableWindow(
            contentRect: NSMakeRect(0, 0, 1440, 900),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered, defer: false
        )
        window.title                      = "Cognac"
        window.titlebarAppearsTransparent = true
        window.titleVisibility            = .hidden
        window.backgroundColor            = bg
        window.isMovableByWindowBackground = true
        window.minSize                    = NSSize(width: 900, height: 600)
        window.contentView                = webView
        
        window.center()
        window.setFrameAutosaveName("CognacMain")
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func loadMain() {
        // Inject Mac Username
        let userName = NSFullUserName()
        let js = "window.MAC_USER = '\(userName)';"
        let script = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        webView.configuration.userContentController.addUserScript(script)
        
        let req = URLRequest(url: URL(string: "http://localhost:5173")!)
        webView.load(req)
    }

    @objc func reloadApp(_ sender: Any?) {
        webView.reload()
    }

    // MARK: - Auth popup (SubView Overlay)

    func webView(
        _ wv: WKWebView,
        createWebViewWith cfg: WKWebViewConfiguration,
        for action: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {

        // Hiçbir JS script'i enjekte etmiyoruz (Apple'ın akışını bozmamak için)
        let overlay = WKWebView(frame: webView.bounds, configuration: cfg)
        overlay.autoresizingMask = [.width, .height]
        overlay.uiDelegate = self
        overlay.wantsLayer = true
        overlay.layer?.backgroundColor = NSColor.white.cgColor

        webView.addSubview(overlay)
        authOverlay = overlay

        let closeBtn = NSButton(title: "✕ İptal", target: self, action: #selector(cancelAuth))
        closeBtn.frame = NSRect(x: 20, y: overlay.bounds.height - 50, width: 80, height: 30)
        closeBtn.bezelStyle = .rounded
        closeBtn.autoresizingMask = [.minYMargin, .maxXMargin]
        overlay.addSubview(closeBtn)
        authCloseBtn = closeBtn

        if let url = action.request.url {
            overlay.load(URLRequest(url: url))
        }

        startAuthPolling()
        return overlay
    }

    @objc func cancelAuth() {
        finishAuth()
    }

    func webViewDidClose(_ wv: WKWebView) {
        guard wv === authOverlay else { return }
        finishAuth()
    }

    func startAuthPolling() {
        authPollTimer?.invalidate()
        authPollTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] t in
            guard let self = self, self.authOverlay != nil else { t.invalidate(); return }
            
            WKWebsiteDataStore.default().httpCookieStore.getAllCookies { cookies in
                var debugStr = ""
                for cookie in cookies {
                    debugStr += "\\(cookie.domain) | \\(cookie.name) = \\(cookie.value)\\n"
                    // media-user-token bulundu mu?
                    if cookie.name.contains("media-user-token") || cookie.name == "mut" {
                        let mut = cookie.value
                        let js = """
                            window.localStorage.setItem('music.apple.com.mut', '\(mut)');
                            if (window.MusicKit && window.MusicKit.getInstance) {
                                window.MusicKit.getInstance().musicUserToken = '\(mut)';
                            }
                        """
                        DispatchQueue.main.async {
                            self.webView.evaluateJavaScript(js, completionHandler: nil)
                            self.finishAuth()
                        }
                    }
                }
                // Debug için kaydedelim
                let fileURL = URL(fileURLWithPath: "/Users/serhanagan/Desktop/cookies_debug.txt")
                try? debugStr.write(to: fileURL, atomically: true, encoding: .utf8)
            }
            
            // Eğer cookie yerine sayfanın içinde (HTML) gizliyse onu da yakalayalım
            self.authOverlay?.evaluateJavaScript("document.documentElement.innerHTML") { res, _ in
                if let html = res as? String {
                    if let range = html.range(of: "media-user-token\\\\\":\\\\\"(A[^\\\\\"]+)\\\\\"", options: .regularExpression) {
                        let token = String(html[range]).replacingOccurrences(of: "media-user-token\\\":\\\"", with: "").replacingOccurrences(of: "\\\"", with: "")
                        let js = "window.localStorage.setItem('music.apple.com.mut', '\(token)'); if(window.MusicKit){window.MusicKit.getInstance().musicUserToken='\(token)';}"
                        DispatchQueue.main.async {
                            self.webView.evaluateJavaScript(js, completionHandler: nil)
                            self.finishAuth()
                        }
                    }
                }
            }
        }
    }

    func finishAuth() {
        guard let overlay = authOverlay else { return }
        authPollTimer?.invalidate()
        authPollTimer = nil
        authOverlay = nil
        DispatchQueue.main.async {
            self.authCloseBtn?.removeFromSuperview()
            self.authCloseBtn = nil
            overlay.removeFromSuperview()
            self.window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }
    }

    func webView(_ wv: WKWebView, didFailProvisionalNavigation _: WKNavigation!, withError _: Error) {
        guard wv === webView else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { self.waitForServer(attempts: 5) }
    }
}
