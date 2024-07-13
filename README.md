<div align="center">

<img width="180px" height="auto" src="./logo.png" />

<br>

<h1 style="border-bottom: none; text-transform: uppercase; letter-spacing: 4px";>echo.env</h1>

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/inci-august.echo-env?style=for-the-badge&logo=github&logoColor=e7e9e0&logoSize=auto&label=%20&labelColor=776e9a&color=e7e9e0)
![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/inci-august.echo-env?style=for-the-badge&logo=github&logoColor=e7e9e0&logoSize=auto&label=%20&labelColor=776e9a&color=e7e9e0)

</div>

<p style="letter-spacing: 0.5px">
A VS Code extension that automatically keeps your .env template files in sync with your actual .env files, maintaining a clear record of required environment variables without exposing sensitive data.
</p>

## Features

- 🔄 Auto-sync `.env` files with templates
- 🖊️ Customizable source and destination file names
- 🔧 Configurable placeholder format
- 📈 Status bar indicator for sync status
- 🔔 Optional notifications for sync events

## Installation

1. Open Visual Studio Code
2. Press `Ctrl+P` (or `Cmd+P` on macOS) to open the Quick Open dialog
3. Type `ext install inci-august.echo-env` to find the extension
4. Click the "Install" button

## Usage

1. Open a project with `.env` files
2. The extension will automatically watch for changes in your `.env` files
3. When changes are detected, it will update the corresponding template files
4. You can also manually trigger a sync by clicking the `echoEnv` item in the status bar

### Example

Given a `.env` file:

```
DATABASE_URL=postgres://username:password@localhost:5432/mydb
API_KEY=1234567890abcdef
DEBUG=true
```

echo.env will automatically generate or update a `.env.example` file:

```
DATABASE_URL=your_database_url
API_KEY=your_api_key
DEBUG=your_debug_setting
```

## Configuration

Customize the extension's behavior in your VSCode settings:

```json
{
  "echoEnv.sourceFiles": [".env", ".env.local"],
  "echoEnv.destinationFiles": [".env.template", ".env.example"],
  "echoEnv.placeholderFormat": "your_${key}",
  "echoEnv.showNotifications": true
}
```

- `echoEnv.sourceFiles`: List of source files to watch for changes
- `echoEnv.destinationFiles`: List of destination files to update
- `echoEnv.placeholderFormat`: Format for placeholder values in destination files
- `echoEnv.showNotifications`: Enable or disable notifications for successful syncs (default: true)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
