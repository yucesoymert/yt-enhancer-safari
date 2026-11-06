# YT Enhancer (Safari)

Kişisel kullanım: YouTube için otomatik PiP + Enhancer tarzı bar.

- `extension/`: web extension'ın kendisi (düz JS, build adımı yok)
- `xcode/`: `safari-web-extension-converter` çıktısı. `extension/` klasörünü kopyalamadan referansla kullanıyor.
- `node check.js`: saf JS fonksiyonlarının testi
- `check-swift/main.swift`: "video ne kadar örtülü" hesabının testi (çalıştırma komutu dosyanın ilk satırında)
- `xcode/.../SafariWebExtensionHandler.swift`: yerel (Swift) taraf. Safari arka plandayken diğer pencerelerin
  videoyu ne kadar kapattığını macOS pencere listesinden hesaplıyor. Web sayfası bunu kendisi göremiyor.

## Değişiklikten sonra yeniden derle

```sh
xcodebuild -project "xcode/YT Enhancer/YT Enhancer.xcodeproj" -scheme "YT Enhancer" -configuration Debug \
  -derivedDataPath xcode/build DEVELOPMENT_TEAM=K4QRFFTY6X CODE_SIGN_STYLE=Automatic -allowProvisioningUpdates build
open "xcode/build/Build/Products/Debug/YT Enhancer.app"
```

Sonra YouTube sekmesini yenile.

Hızlı deneme için Xcode gerekmez: Safari > Settings > Developer > Add Temporary Extension… ile `extension/` klasörünü seç.
Bu yöntemle yüklenen extension Safari kapanınca silinir.

## Notlar
- Converter'ı tekrar çalıştırırsan app'in bundle id'sini `com.mertyucesoy.ytenhancer` olarak düzelt.
  Extension id'si bu önekle başlamalı, yoksa build hata verir.
- Safari manifest'teki `"world": "MAIN"` anahtarını desteklemiyor. Bu yüzden `main.js` (kalite ayarı)
  `background.js` içinde `scripting.registerContentScripts` ile kaydediliyor.
