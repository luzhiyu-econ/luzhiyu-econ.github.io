# Claude Code Windows 通用安装脚本
# 支持任意 API Token + Base URL，其余逻辑与官方安装流程一致
#
# 用法：
#   交互式：irm https://你的域名/install-claude-win.ps1 | iex
#   静默式：$env:CLAUDE_CLIENT_TOKEN='sk-xxx'; $env:CLAUDE_API_URL='https://...'; irm ... | iex

# UTF-8 输出
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "  ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗" -ForegroundColor Cyan
Write-Host " ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝" -ForegroundColor Cyan
Write-Host " ██║     ██║     ███████║██║   ██║██║  ██║█████╗  " -ForegroundColor Cyan
Write-Host " ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  " -ForegroundColor Cyan
Write-Host " ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗" -ForegroundColor Cyan
Write-Host "  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Claude Code Windows 通用安装脚本" -ForegroundColor White
Write-Host "  支持官方 API 及任意第三方中转服务" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────────
# 步骤 0：获取 API 配置（交互式 或 环境变量）
# ─────────────────────────────────────────────────────────────
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  步骤 0: API 配置" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Token ──
$CLAUDE_TOKEN = $env:CLAUDE_CLIENT_TOKEN
if (-not $CLAUDE_TOKEN) {
    Write-Host "[INPUT] 请输入 API Token：" -ForegroundColor Yellow
    $CLAUDE_TOKEN = Read-Host "       Token"
    if (-not $CLAUDE_TOKEN) {
        Write-Host "[ERROR] Token 不能为空，请重新运行并输入有效 Token" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }
} else {
    Write-Host "[OK]    已从环境变量读取 Token" -ForegroundColor Green
}

# ── API URL ──
$CLAUDE_API_URL = $env:CLAUDE_API_URL
if (-not $CLAUDE_API_URL) {
    Write-Host "[INPUT] 请输入 API Base URL：" -ForegroundColor Yellow
    $CLAUDE_API_URL = Read-Host "       API URL"
    if (-not $CLAUDE_API_URL) {
        Write-Host "[ERROR] API URL 不能为空，请重新运行并输入有效 URL" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }
} else {
    Write-Host "[OK]    已从环境变量读取 API URL: $CLAUDE_API_URL" -ForegroundColor Green
}

Write-Host ""
Write-Host "[CONFIRM] 配置确认：" -ForegroundColor Cyan
Write-Host "  Token  : $($CLAUDE_TOKEN.Substring(0, [Math]::Min(12, $CLAUDE_TOKEN.Length)))...（已隐藏）" -ForegroundColor White
Write-Host "  API URL: $CLAUDE_API_URL" -ForegroundColor White
Write-Host ""

# ─────────────────────────────────────────────────────────────
# 检查 PowerShell 版本
# ─────────────────────────────────────────────────────────────
if ($PSVersionTable.PSVersion.Major -lt 3) {
    Write-Host "[ERROR] 需要 PowerShell 3.0 或更高版本" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

# ─────────────────────────────────────────────────────────────
# 工具函数
# ─────────────────────────────────────────────────────────────
function Compare-Version {
    param ([string]$current, [string]$required)
    $c = $current.Split('.') | ForEach-Object { [int]$_ }
    $r = $required.Split('.') | ForEach-Object { [int]$_ }
    for ($i = 0; $i -lt [Math]::Max($c.Length, $r.Length); $i++) {
        $cv = if ($i -lt $c.Length) { $c[$i] } else { 0 }
        $rv = if ($i -lt $r.Length) { $r[$i] } else { 0 }
        if ($cv -gt $rv) { return 1 }
        if ($cv -lt $rv) { return -1 }
    }
    return 0
}

function Check-NodejsVersion {
    Write-Host "[CHECK] 检查 Node.js 版本..." -ForegroundColor Yellow
    $requiredVersion = "18.0.0"
    try {
        $nodeVersion = & node --version 2>$null
        if ($nodeVersion) {
            $currentVersion = $nodeVersion -replace '^v', ''
            Write-Host "[INFO]  当前 Node.js: v$currentVersion（要求 >= v$requiredVersion）" -ForegroundColor Gray
            if ((Compare-Version -current $currentVersion -required $requiredVersion) -ge 0) {
                Write-Host "[OK]    Node.js 版本检查通过" -ForegroundColor Green
                return $true
            } else {
                Write-Host "[WARN]  Node.js 版本不满足要求" -ForegroundColor Yellow
                return $false
            }
        }
    } catch {}
    Write-Host "[WARN]  未检测到 Node.js，需要安装" -ForegroundColor Yellow
    return $false
}

function Install-Nodejs {
    Write-Host "[INSTALL] 安装 Node.js..." -ForegroundColor Cyan
    $wingetInstalled = Get-Command winget -ErrorAction SilentlyContinue
    if ($wingetInstalled) {
        Write-Host "[INFO]  通过 winget 安装 Node.js LTS..." -ForegroundColor Yellow
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-Host "[INFO]  下载 Node.js 安装包..." -ForegroundColor Yellow
        $nodeUrl = "https://nodejs.org/dist/v24.12.0/node-v24.12.0-x64.msi"
        $installerPath = "$env:TEMP\nodejs-installer.msi"
        try {
            Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UseBasicParsing
            Write-Host "[INFO]  正在安装 Node.js（静默安装）..." -ForegroundColor Yellow
            $proc = Start-Process msiexec.exe -ArgumentList "/i", "`"$installerPath`"", "/quiet", "/norestart" -Wait -PassThru
            if ($proc.ExitCode -ne 0) { throw "MSI 安装返回非零退出码: $($proc.ExitCode)" }
            Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            Write-Host "[OK]    Node.js 安装完成！" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Node.js 自动安装失败: $_" -ForegroundColor Red
            Write-Host "[INFO]  请手动安装 Node.js: https://nodejs.org/" -ForegroundColor Cyan
            Read-Host "按 Enter 退出"
            exit 1
        }
    }
}

# ─────────────────────────────────────────────────────────────
# 步骤 1：Node.js 检查与安装
# ─────────────────────────────────────────────────────────────
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  步骤 1: Node.js 环境检查" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Check-NodejsVersion)) {
    Install-Nodejs
    if (-not (Check-NodejsVersion)) {
        Write-Host "[ERROR] Node.js 安装失败，请手动安装后重试" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }
} else {
    Write-Host "[OK]    Node.js 版本满足要求，跳过安装" -ForegroundColor Green
}
Write-Host ""

# ─────────────────────────────────────────────────────────────
# 步骤 2：安装 Bun
# ─────────────────────────────────────────────────────────────
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  步骤 2: 安装 Bun" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$bunInstalled = $false
try {
    $bunVersion = & bun --version 2>$null
    if ($bunVersion) {
        Write-Host "[OK]    Bun 已安装: v$bunVersion" -ForegroundColor Green
        $bunInstalled = $true
    }
} catch {}

if (-not $bunInstalled) {
    Write-Host "[INSTALL] 安装 Bun..." -ForegroundColor Yellow
    try {
        powershell -c "irm bun.sh/install.ps1 | iex"
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        $bunBin = "$env:USERPROFILE\.bun\bin"
        if (Test-Path "$bunBin\bun.exe") {
            $env:Path = "$bunBin;$env:Path"
        }
        Write-Host "[OK]    Bun 安装完成！" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Bun 安装失败: $_" -ForegroundColor Red
        Write-Host "[INFO]  请手动安装 Bun: https://bun.sh" -ForegroundColor Cyan
        Read-Host "按 Enter 退出"
        exit 1
    }
}
Write-Host ""

# ─────────────────────────────────────────────────────────────
# 步骤 3：安装 Claude Code
# ─────────────────────────────────────────────────────────────
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  步骤 3: 安装 Claude Code" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO]  清理旧版本..." -ForegroundColor Gray
try { & bun uninstall -g @anthropic-ai/claude-code 2>$null | Out-Null } catch {}
try { & npm uninstall -g @anthropic-ai/claude-code 2>$null | Out-Null } catch {}

$installSuccess = $false

Write-Host "[INFO]  尝试官方安装脚本..." -ForegroundColor Gray
try {
    irm https://claude.ai/install.ps1 | iex
    # 验证 claude 命令实际可用，避免脚本静默失败
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    if (Get-Command claude -ErrorAction SilentlyContinue) {
        Write-Host "[OK]    Claude Code 安装成功（官方脚本）！" -ForegroundColor Green
        $installSuccess = $true
    } else {
        throw "官方脚本运行完成但 claude 命令不可用"
    }
} catch {
    Write-Host "[WARN]  官方脚本失败，切换到 Bun..." -ForegroundColor Yellow
}

if (-not $installSuccess) {
    Write-Host "[INFO]  通过 Bun 安装..." -ForegroundColor Gray
    try {
        & bun install -g @anthropic-ai/claude-code 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK]    Claude Code 安装成功（Bun）！" -ForegroundColor Green
            $installSuccess = $true

            # Bun 安全策略不执行 postinstall，需手动运行以下载 native binary
            Write-Host "[INFO]  运行 postinstall 下载 native binary..." -ForegroundColor Gray
            $bunGlobalInstall = Join-Path $env:USERPROFILE ".bun\install\global\node_modules\@anthropic-ai\claude-code\install.cjs"
            $postinstallScript = $null

            if (Test-Path $bunGlobalInstall) {
                $postinstallScript = $bunGlobalInstall
            } else {
                $bunGlobalRoot = Join-Path $env:USERPROFILE ".bun\install\global"
                if (Test-Path $bunGlobalRoot) {
                    $found = Get-ChildItem -Path $bunGlobalRoot -Recurse -Filter "install.cjs" -ErrorAction SilentlyContinue |
                        Where-Object { $_.FullName -match "claude-code" } |
                        Select-Object -First 1
                    if ($found) { $postinstallScript = $found.FullName }
                }
            }

            if ($postinstallScript -and (Test-Path $postinstallScript)) {
                try {
                    & node $postinstallScript
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "[OK]    Native binary 下载完成！" -ForegroundColor Green
                    } else {
                        throw "退出码 $LASTEXITCODE"
                    }
                } catch {
                    Write-Host "[WARN]  postinstall 失败，请手动运行：" -ForegroundColor Yellow
                    Write-Host "  node `"$postinstallScript`"" -ForegroundColor Cyan
                }
            } else {
                Write-Host "[WARN]  未找到 postinstall 脚本，请手动运行：" -ForegroundColor Yellow
                Write-Host "  node `"$bunGlobalInstall`"" -ForegroundColor Cyan
            }
        } else {
            throw "Bun 安装返回非零退出码"
        }
    } catch {
        Write-Host "[ERROR] Claude Code 安装失败: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "请手动运行：" -ForegroundColor Yellow
        Write-Host "  irm https://claude.ai/install.ps1 | iex" -ForegroundColor Cyan
        Read-Host "按 Enter 退出"
        exit 1
    }
}
Write-Host ""

# ─────────────────────────────────────────────────────────────
# 步骤 4：写入配置文件
# ─────────────────────────────────────────────────────────────
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  步骤 4: 写入配置文件" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$claudeDir = Join-Path $env:USERPROFILE ".claude"
if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
    Write-Host "[OK]    创建 .claude 目录" -ForegroundColor Green
}

# ── settings.json ──
$settingsPath = Join-Path $claudeDir "settings.json"
Write-Host "[CONFIG] 写入 settings.json..." -ForegroundColor Yellow
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

try {
    if (Test-Path $settingsPath) {
        Write-Host "[INFO]  settings.json 已存在，增量更新..." -ForegroundColor Gray
        try {
            $s = Get-Content $settingsPath -Raw | ConvertFrom-Json
            if (-not $s.env) {
                $s | Add-Member -NotePropertyName "env" -NotePropertyValue ([PSCustomObject]@{}) -Force
            }
            $s.env | Add-Member -NotePropertyName "ANTHROPIC_API_KEY"               -NotePropertyValue $CLAUDE_TOKEN -Force
            $s.env | Add-Member -NotePropertyName "ANTHROPIC_BASE_URL"                 -NotePropertyValue $CLAUDE_API_URL -Force
            $s.env | Add-Member -NotePropertyName "API_TIMEOUT_MS"                     -NotePropertyValue 600000 -Force
            $s.env | Add-Member -NotePropertyName "CLAUDE_CODE_DISABLE_1M_CONTEXT"     -NotePropertyValue "1" -Force
            $s.env | Add-Member -NotePropertyName "CLAUDE_CODE_DISABLE_TERMINAL_TITLE" -NotePropertyValue "1" -Force
            $s.env | Add-Member -NotePropertyName "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC" -NotePropertyValue "1" -Force
            if (-not $s.permissions) {
                $s | Add-Member -NotePropertyName "permissions" -NotePropertyValue ([PSCustomObject]@{allow=@();deny=@()}) -Force
            }
            [System.IO.File]::WriteAllText($settingsPath, ($s | ConvertTo-Json -Depth 10), $utf8NoBom)
            Write-Host "[OK]    settings.json 更新完成" -ForegroundColor Green
        } catch {
            $ts = Get-Date -Format "yyyyMMdd_HHmmss"
            Copy-Item -Path $settingsPath -Destination "$settingsPath.bak.$ts" -Force
            Write-Host "[INFO]  原文件已备份为 settings.json.bak.$ts" -ForegroundColor Gray
            throw
        }
    } else {
        $json = @"
{
  "env": {
    "ANTHROPIC_API_KEY": "$CLAUDE_TOKEN",
    "ANTHROPIC_BASE_URL": "$CLAUDE_API_URL",
    "API_TIMEOUT_MS": 600000,
    "CLAUDE_CODE_DISABLE_1M_CONTEXT": "1",
    "CLAUDE_CODE_DISABLE_TERMINAL_TITLE": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "allow": [],
    "deny": []
  }
}
"@
        [System.IO.File]::WriteAllText($settingsPath, $json, $utf8NoBom)
        Write-Host "[OK]    settings.json 创建完成" -ForegroundColor Green
    }
} catch {
    # 最终回退：直接写入
    $json = @"
{
  "env": {
    "ANTHROPIC_API_KEY": "$CLAUDE_TOKEN",
    "ANTHROPIC_BASE_URL": "$CLAUDE_API_URL",
    "API_TIMEOUT_MS": 600000,
    "CLAUDE_CODE_DISABLE_1M_CONTEXT": "1",
    "CLAUDE_CODE_DISABLE_TERMINAL_TITLE": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "allow": [],
    "deny": []
  }
}
"@
    [System.IO.File]::WriteAllText($settingsPath, $json, $utf8NoBom)
    Write-Host "[OK]    settings.json 已重新创建" -ForegroundColor Green
}

# ── .claude.json ──
$claudeJsonPath = Join-Path $env:USERPROFILE ".claude.json"
Write-Host "[CONFIG] 写入 .claude.json..." -ForegroundColor Yellow
try {
    if (Test-Path $claudeJsonPath) {
        try {
            $cj = Get-Content $claudeJsonPath -Raw | ConvertFrom-Json
            $cj | Add-Member -NotePropertyName "hasCompletedOnboarding" -NotePropertyValue $true -Force
            [System.IO.File]::WriteAllText($claudeJsonPath, ($cj | ConvertTo-Json), $utf8NoBom)
        } catch {
            [System.IO.File]::WriteAllText($claudeJsonPath, '{"hasCompletedOnboarding": true}', $utf8NoBom)
        }
    } else {
        [System.IO.File]::WriteAllText($claudeJsonPath, '{"hasCompletedOnboarding": true}', $utf8NoBom)
    }
    Write-Host "[OK]    .claude.json 配置完成" -ForegroundColor Green
} catch {
    Write-Host "[WARN]  .claude.json 写入失败: $_" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────
# 完成
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  🎉 安装完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  配置文件：" -ForegroundColor Gray
Write-Host "    $settingsPath" -ForegroundColor Yellow
Write-Host "    $claudeJsonPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "  API URL : $CLAUDE_API_URL" -ForegroundColor Gray
Write-Host "  Token   : 已自动配置" -ForegroundColor Gray
Write-Host ""
Write-Host "  启动方式：在新终端运行 claude" -ForegroundColor Cyan
Write-Host ""

$startNow = Read-Host "是否立即启动 Claude Code？(Y/n)"
if ($startNow -ne "n" -and $startNow -ne "N") {
    Write-Host "[START] 启动 Claude Code..." -ForegroundColor Yellow
    & claude
}
