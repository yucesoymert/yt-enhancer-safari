// swiftc -o /tmp/yte-check "xcode/YT Enhancer/YT Enhancer Extension/SafariWebExtensionHandler.swift" check-swift/main.swift && /tmp/yte-check
import CoreGraphics
let v = CGRect(x: 0, y: 0, width: 100, height: 100)
precondition(hiddenFraction(v, under: []) == 0)
precondition(hiddenFraction(v, under: [CGRect(x: 0, y: 0, width: 50, height: 100)]) == 0.5)
precondition(hiddenFraction(v, under: [CGRect(x: -10, y: -10, width: 200, height: 200)]) == 1)
precondition(hiddenFraction(v, under: [CGRect(x: 0, y: 0, width: 50, height: 100), CGRect(x: 0, y: 0, width: 100, height: 50)]) == 0.75) // overlap counted once
print("ok")
