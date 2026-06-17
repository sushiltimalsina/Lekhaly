#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn save_export_file(file_name: String, bytes: Vec<u8>) -> Result<Option<String>, String> {
    let extension = file_name
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_ascii_lowercase();

    let filter = match extension.as_str() {
        "pdf" => "PDF document (*.pdf)|*.pdf",
        "xlsx" => "Excel workbook (*.xlsx)|*.xlsx",
        "csv" => "CSV file (*.csv)|*.csv",
        _ => "Export file (*.*)|*.*",
    };

    let script = format!(
        r#"
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.SaveFileDialog
$dialog.FileName = {file_name:?}
$dialog.Filter = {filter:?}
$dialog.OverwritePrompt = $true
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {{
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  Write-Output $dialog.FileName
}}
"#
    );

    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-STA", "-Command", &script])
        .output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if path.is_empty() {
        return Ok(None);
    }

    std::fs::write(&path, bytes).map_err(|error| error.to_string())?;
    Ok(Some(path))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![save_export_file])
        .run(tauri::generate_context!())
        .expect("error while running Lekhaly desktop application");
}
