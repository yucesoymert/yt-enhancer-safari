import SafariServices
import AppKit

// Answers one question for auto-PiP: how much of the video is hidden behind other windows?
// A web page can't see other apps' windows; CGWindowList can (bounds/owner/layer need no screen-recording permission).
class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems.first as? NSExtensionItem
        let msg = item?.userInfo?[SFExtensionMessageKey] as? [String: Any] ?? [:]
        let response = NSExtensionItem()
        response.userInfo = [SFExtensionMessageKey: ["covered": coveredFraction(msg)]]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}

/// msg: video rect (x, y, w, h) and its Safari window frame (wx, wy, ww, wh), global top-left screen points.
func coveredFraction(_ m: [String: Any]) -> Double {
    let n = { (k: String) in (m[k] as? NSNumber)?.doubleValue }
    guard let x = n("x"), let y = n("y"), let w = n("w"), let h = n("h"), w > 0, h > 0,
          let wx = n("wx"), let wy = n("wy"), let ww = n("ww"), let wh = n("wh"),
          let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]]
    else { return 0 }

    let safariPids = Set(NSRunningApplication.runningApplications(withBundleIdentifier: "com.apple.Safari").map(\.processIdentifier))
    let target = CGRect(x: wx, y: wy, width: ww, height: wh)
    var above: [CGRect] = []
    for info in list { // ordered front to back
        guard let dict = info[kCGWindowBounds as String] as? NSDictionary,
              let f = CGRect(dictionaryRepresentation: dict) else { continue }
        let pid = info[kCGWindowOwnerPID as String] as? pid_t ?? 0
        if safariPids.contains(pid), abs(f.minX - target.minX) < 4, abs(f.minY - target.minY) < 4,
           abs(f.width - target.width) < 4, abs(f.height - target.height) < 4 {
            return hiddenFraction(CGRect(x: x, y: y, width: w, height: h), under: above)
        }
        // Normal windows only: skips menu bar, Dock, floating panels and the PiP window itself.
        let layer = info[kCGWindowLayer as String] as? Int ?? 0
        let alpha = info[kCGWindowAlpha as String] as? Double ?? 1
        if layer == 0, alpha > 0 { above.append(f) }
    }
    return 0 // our window isn't on screen (other Space, full screen elsewhere); visibilitychange covers the rest
}

// ponytail: 10x10 point sampling instead of exact rect-union area; ±1% error is plenty for a 50% threshold.
func hiddenFraction(_ video: CGRect, under windows: [CGRect]) -> Double {
    var hidden = 0
    for i in 0..<10 {
        for j in 0..<10 {
            let p = CGPoint(x: video.minX + (Double(i) + 0.5) * video.width / 10,
                            y: video.minY + (Double(j) + 0.5) * video.height / 10)
            if windows.contains(where: { $0.contains(p) }) { hidden += 1 }
        }
    }
    return Double(hidden) / 100
}
