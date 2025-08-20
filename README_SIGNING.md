Secure Android signing setup

1) Create keystore (or use your existing one) and place it outside version control, e.g. android/app/your-release-key.jks

2) Create keystore.properties at the project root (do NOT commit it):

storeFile=android/app/your-release-key.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=YOUR_KEY_ALIAS
keyPassword=YOUR_KEY_PASSWORD

3) Ensure .gitignore contains:

*.jks
*.keystore
keystore.properties

4) Build

For debug builds, the default Android debug keystore is used.
For release builds, Gradle will read values from keystore.properties.
