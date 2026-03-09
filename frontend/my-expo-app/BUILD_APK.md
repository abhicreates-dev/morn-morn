# Build signed release APK (morn-morn)

## 1. Install Java (JDK)

The build needs Java. Install a JDK (e.g. OpenJDK 17):

- **macOS (Homebrew):** `brew install openjdk@17`
- **Windows:** Download from [adoptium.net](https://adoptium.net/) or use Chocolatey.
- **Linux:** `sudo apt install openjdk-17-jdk` (or your distro’s package).

Then run `java -version` to confirm.

## 2. Create the release keystore (one-time)

From the project root (`frontend/my-expo-app`):

```bash
chmod +x scripts/create-release-keystore.sh
./scripts/create-release-keystore.sh
```

Or manually:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore \
  -alias morn-morn-key -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass Apple5040 -keypass Apple5040 \
  -dname "CN=Abhi Salunke, OU=Mobile, O=MornMorn, L=Pune, ST=Maharashtra, C=IN"
```

This creates `android/app/release.keystore`. Do not commit it; it’s in `.gitignore`.

## 3. Build the release APK

```bash
cd android
./gradlew assembleRelease
```

The signed APK will be at:

```
android/app/build/outputs/apk/release/app-release.apk
```

## 4. Verify signature (optional)

```bash
jarsigner -verify android/app/build/outputs/apk/release/app-release.apk
# Should print: jar verified
```

## 5. Install on a device

Connect the device with USB debugging enabled, then:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Notes

- **Keystore password** is in `android/gradle.properties` (not committed). Keep the keystore and password safe; you need them for all future updates.
- **Version:** Before each release, bump `version` and `android.versionCode` in `app.json`; `versionCode` must increase for Play Store.
- **Prebuild:** If you run `npx expo prebuild --platform android --clean` again, the `android` folder is regenerated and you may need to re-apply the signing config in `android/app/build.gradle` and `android/gradle.properties` (or re-run this setup).
