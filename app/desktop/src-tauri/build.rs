fn main() {
    for p in [
        "icons/icon.ico",
        "icons/32x32.png",
        "icons/64x64.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.png",
        "tauri.conf.json",
    ] {
        println!("cargo:rerun-if-changed={p}");
    }
    tauri_build::build()
}
