#!/usr/bin/env bash
# Create release.keystore for signing the production APK.
# Run once after installing Java (JDK). Then run: cd android && ./gradlew assembleRelease
set -e
cd "$(dirname "$0")/../android/app"
if [ -f release.keystore ]; then
  echo "release.keystore already exists. Remove it first if you want to regenerate."
  exit 0
fi
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore \
  -alias morn-morn-key -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass Apple5040 -keypass Apple5040 \
  -dname "CN=Abhi Salunke, OU=Mobile, O=MornMorn, L=Pune, ST=Maharashtra, C=IN"
echo "Created android/app/release.keystore"
