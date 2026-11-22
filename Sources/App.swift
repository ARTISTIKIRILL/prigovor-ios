import UIKit
import WebKit

// «Приговор» для iPhone: та же веб-игра, что в браузере и в APK, внутри WKWebView.
// Файлы игры лежат в бандле (папка game) и отдаются по адресу app://prigovor/ — у страницы
// свой адрес, поэтому работают fetch(), модули, iframe катсцены и сохранения (localStorage).

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let w = UIWindow(frame: UIScreen.main.bounds)
        w.rootViewController = GameViewController()
        w.backgroundColor = .black
        w.makeKeyAndVisible()
        window = w
        UIApplication.shared.isIdleTimerDisabled = true   // экран не гаснет во время игры
        return true
    }
}

/// Отдаёт файлы из папки game внутри приложения.
final class GameFiles: NSObject, WKURLSchemeHandler {
    static let mime: [String: String] = [
        "html": "text/html", "js": "text/javascript", "mjs": "text/javascript", "json": "application/json",
        "txt": "text/plain", "css": "text/css", "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "svg": "image/svg+xml", "mp3": "audio/mpeg", "ogg": "audio/ogg", "wav": "audio/wav",
        "gz": "application/octet-stream", "glb": "model/gltf-binary", "woff2": "font/woff2"
    ]
    let root: URL = Bundle.main.resourceURL!.appendingPathComponent("game")

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/menu.html" }
        let file = root.appendingPathComponent(String(path.dropFirst()))
        guard file.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path),
              let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
            let r = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "text/plain"])!
            task.didReceive(r)
            task.didReceive(Data("Not Found".utf8))
            task.didFinish()
            return
        }
        let type = GameFiles.mime[file.pathExtension.lowercased()] ?? "application/octet-stream"
        let headers = ["Content-Type": type, "Content-Length": String(data.count),
                       "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache"]
        let r = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
        task.didReceive(r)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

final class GameViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    static let start = URL(string: "app://prigovor/menu.html")!
    var web: WKWebView!

    override func loadView() {
        let cfg = WKWebViewConfiguration()
        cfg.setURLSchemeHandler(GameFiles(), forURLScheme: "app")
        cfg.allowsInlineMediaPlayback = true
        cfg.mediaTypesRequiringUserActionForPlayback = []
        cfg.websiteDataStore = .default()                 // сохранения не теряются между запусками
        web = WKWebView(frame: .zero, configuration: cfg)
        web.isOpaque = false
        web.backgroundColor = .black
        web.scrollView.backgroundColor = .black
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.navigationDelegate = self
        web.uiDelegate = self
        if #available(iOS 16.4, *) { web.isInspectable = true }
        view = web
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        web.load(URLRequest(url: GameViewController.start))
    }

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }

    // переходы между страницами игры разрешены; внешние ссылки внутри игры не открываем
    // (three.js и шрифты с CDN грузятся как подресурсы и сюда не попадают)
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let scheme = action.request.url?.scheme ?? ""
        if ["app", "about", "blob", "data"].contains(scheme) || action.targetFrame?.isMainFrame == false {
            decisionHandler(.allow)
        } else {
            decisionHandler(.cancel)
        }
    }

    // если система выгрузила WebView из-за нехватки памяти — возвращаемся в меню, а не к белому экрану
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.load(URLRequest(url: GameViewController.start))
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Отмена", style: .cancel) { _ in completionHandler(false) })
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(a, animated: true)
    }
}
