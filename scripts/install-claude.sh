#!/bin/bash

set -e

# ──────────────────────────────────────────────────────────────
# Claude Code 通用一键安装脚本
# 支持任意 API 中转地址 + Key，其余逻辑与官方安装流程一致
# 用法：
#   交互式：bash install-claude.sh
#   静默式：CLAUDE_TOKEN="sk-xxx" CLAUDE_API_URL="https://..." bash install-claude.sh
# ──────────────────────────────────────────────────────────────

# 颜色定义
colorReset='\033[0m'
colorBright='\033[1m'
colorCyan='\033[36m'
colorYellow='\033[33m'
colorRed='\033[31m'
colorBlue='\033[34m'
colorWhite='\033[37m'
colorGreen='\033[32m'

show_banner() {
    printf "${colorBright}${colorCyan}   ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗${colorReset}\n"
    printf "${colorBright}${colorCyan}  ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝${colorReset}\n"
    printf "${colorBright}${colorCyan}  ██║     ██║     ███████║██║   ██║██║  ██║█████╗  ${colorReset}\n"
    printf "${colorBright}${colorCyan}  ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  ${colorReset}\n"
    printf "${colorBright}${colorCyan}  ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗${colorReset}\n"
    printf "${colorBright}${colorCyan}   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝${colorReset}\n"
    printf "\n"
    printf "${colorBright}${colorGreen}============== Claude Code 通用安装脚本 ==============${colorReset}\n"
    printf "${colorBright}${colorWhite}   支持官方 API 及任意第三方中转服务${colorReset}\n"
    printf "${colorBright}${colorGreen}=====================================================${colorReset}\n"
    printf "\n"
}

show_step() {
    local step_num=$1
    local step_name=$2
    local description=$3
    printf "${colorBright}${colorCyan}┌──────────────────────────────────────────────────────────┐${colorReset}\n"
    printf "${colorBright}${colorCyan}│ ${colorYellow}步骤 ${step_num}${colorCyan}: ${colorWhite}${step_name}${colorReset}\n"
    printf "${colorBright}${colorCyan}│ ${colorWhite}${description}${colorReset}\n"
    printf "${colorBright}${colorCyan}└──────────────────────────────────────────────────────────┘${colorReset}\n"
    printf "\n"
}

show_success() { printf "${colorBright}${colorGreen}✅ ${1}${colorReset}\n"; }
show_warning() { printf "${colorBright}${colorYellow}⚠️  ${1}${colorReset}\n"; }
show_error()   { printf "${colorBright}${colorRed}❌ ${1}${colorReset}\n"; }
show_progress(){ printf "${colorBright}${colorBlue}🔄 ${1}${colorReset}\n"; }

# ──────────────────────────────────────────────────────────────
# 步骤 0：交互式获取 API 配置
# ──────────────────────────────────────────────────────────────
show_banner

show_step "0" "API 配置" "输入你的 API Key 和 Base URL（两项均为必填）"

# ── Token ──
if [ -z "$CLAUDE_TOKEN" ]; then
    printf "${colorBright}${colorYellow}请输入 API Key（输入时不回显）${colorReset}\n"
    printf "${colorCyan}> ${colorReset}"
    read -rs CLAUDE_TOKEN
    printf "\n"
    if [ -z "$CLAUDE_TOKEN" ]; then
        show_error "Key 不能为空，请重新运行并输入有效 Key"
        exit 1
    fi
else
    show_success "已从环境变量读取 Key"
fi

# ── API URL ──
if [ -z "$CLAUDE_API_URL" ]; then
    printf "${colorBright}${colorYellow}请输入 API Base URL${colorReset}\n"
    printf "${colorCyan}> ${colorReset}"
    read -r CLAUDE_API_URL
    if [ -z "$CLAUDE_API_URL" ]; then
        show_error "API URL 不能为空，请重新运行并输入有效 URL"
        exit 1
    fi
else
    show_success "已从环境变量读取 API URL: $CLAUDE_API_URL"
fi

printf "\n"
printf "${colorBright}${colorGreen}配置确认：${colorReset}\n"
printf "  ${colorCyan}Key    :${colorReset} ${CLAUDE_TOKEN:0:12}...（已隐藏）\n"
printf "  ${colorCyan}API URL:${colorReset} $CLAUDE_API_URL\n"
printf "\n"

# ──────────────────────────────────────────────────────────────
# 步骤 1：系统检查 & Node.js 环境
# ──────────────────────────────────────────────────────────────
show_step "1" "系统环境检查" "检查当前操作系统兼容性"
OS="$(uname)"
show_progress "检测到操作系统: $OS"

if [[ "$OS" != "Darwin" && "$OS" != "Linux" ]]; then
    show_error "仅支持 macOS 和 Linux 系统"
    exit 1
fi
show_success "操作系统检查通过"

if [[ "$SHELL" == *"zsh"* ]]; then
    PROFILE="$HOME/.zshrc"
    SHELL_NAME="zsh"
else
    PROFILE="$HOME/.bashrc"
    SHELL_NAME="bash"
fi
show_progress "检测到 Shell: $SHELL_NAME，配置文件: $PROFILE"

# 函数：确保 claude 在 PATH 中
ensure_claude_in_path() {
    if command -v claude >/dev/null 2>&1; then
        return 0
    fi

    # 构建候选目录列表：
    # 1. 固定默认路径
    # 2. bun 可执行文件所在目录（应对 homebrew/nix/apt 等非默认安装）
    # 3. bun 全局 bin（通过 BUN_INSTALL 环境变量）
    local search_dirs=("$HOME/.local/bin" "$HOME/.bun/bin")
    if command -v bun >/dev/null 2>&1; then
        # bun 可执行文件所在目录（应对 homebrew/nix/apt 等非默认安装）
        local _bun_bin_dir
        _bun_bin_dir="$(dirname "$(command -v bun)")"
        search_dirs+=("$_bun_bin_dir")
        # bun 全局 bin：遵循 BUN_INSTALL 规范，默认 ~/.bun/bin
        local _bun_install_bin="${BUN_INSTALL:-$HOME/.bun}/bin"
        search_dirs+=("$_bun_install_bin")
    fi

    for dir in "${search_dirs[@]}"; do
        if [ -x "$dir/claude" ]; then
            show_progress "在 $dir 找到 claude，正在添加到 PATH..."
            export PATH="$dir:$PATH"
            # 写入 profile（绝对路径或 $HOME 相对路径均支持）
            local path_entry
            if [[ "$dir" == "$HOME"* ]]; then
                local relative_dir="${dir#$HOME}"
                path_entry="export PATH=\"\$HOME${relative_dir}:\$PATH\""
                grep -q "$relative_dir" "$PROFILE" 2>/dev/null || {
                    echo '' >> "$PROFILE"
                    echo "# Claude Code PATH" >> "$PROFILE"
                    echo "$path_entry" >> "$PROFILE"
                    show_success "\$HOME${relative_dir} 已添加到 $PROFILE"
                }
            else
                path_entry="export PATH=\"${dir}:\$PATH\""
                grep -q "$dir" "$PROFILE" 2>/dev/null || {
                    echo '' >> "$PROFILE"
                    echo "# Claude Code PATH" >> "$PROFILE"
                    echo "$path_entry" >> "$PROFILE"
                    show_success "${dir} 已添加到 $PROFILE"
                }
            fi
            return 0
        fi
    done

    # 最后手段：在 bun 相关目录下广域搜索
    show_progress "在候选目录中未找到 claude，尝试广域搜索..."
    local found
    found=$(find "$HOME/.bun" "$HOME/.local" -maxdepth 6 -name "claude" -type f 2>/dev/null | head -1)
    if [ -n "$found" ]; then
        local found_dir
        found_dir="$(dirname "$found")"
        show_progress "广域搜索找到: $found_dir/claude"
        export PATH="$found_dir:$PATH"
        grep -q "$found_dir" "$PROFILE" 2>/dev/null || {
            echo '' >> "$PROFILE"
            echo "# Claude Code PATH" >> "$PROFILE"
            echo "export PATH=\"${found_dir}:\$PATH\"" >> "$PROFILE"
            show_success "${found_dir} 已添加到 $PROFILE"
        }
        return 0
    fi
    return 1
}

version_compare() {
    printf '%s\n%s' "$1" "$2" | sort -V | head -n1
}

check_nodejs_version() {
    show_progress "正在检查 Node.js 版本..."
    if command -v node >/dev/null 2>&1; then
        current_version=$(node --version | sed 's/v//')
        required_version="18.0.0"
        show_progress "当前 Node.js 版本: v$current_version（要求 >= v$required_version）"
        if [[ "$(version_compare "$current_version" "$required_version")" == "$required_version" ]]; then
            show_success "Node.js 版本检查通过"
            return 0
        else
            show_warning "Node.js 版本不满足要求"
            return 1
        fi
    else
        show_warning "未检测到 Node.js，需要安装"
        return 1
    fi
}

install_nvm() {
    show_step "1.2" "安装 NVM" "Node Version Manager - Node.js 版本管理工具"
    export NVM_DIR="$HOME/.nvm"
    if [ -d "$NVM_DIR" ]; then
        show_progress "清理现有 NVM 安装..."
        rm -rf "$NVM_DIR"
    fi
    mkdir -p "$NVM_DIR"
    show_progress "正在下载 NVM v0.40.3..."
    if command -v curl >/dev/null 2>&1; then
        curl -L https://github.com/nvm-sh/nvm/archive/v0.40.3.tar.gz | tar -xz -C "$NVM_DIR" --strip-components=1
    elif command -v wget >/dev/null 2>&1; then
        wget -qO- https://github.com/nvm-sh/nvm/archive/v0.40.3.tar.gz | tar -xz -C "$NVM_DIR" --strip-components=1
    else
        show_error "需要 curl 或 wget 来下载 NVM"
        exit 1
    fi
    show_success "NVM 下载完成"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    if ! grep -q "NVM_DIR" "$PROFILE" 2>/dev/null; then
        echo 'export NVM_DIR="$HOME/.nvm"' >> "$PROFILE"
        echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> "$PROFILE"
        echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> "$PROFILE"
        show_success "NVM 环境变量配置完成"
    fi
    export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node/
    export NVM_NPM_MIRROR=https://npmmirror.com/mirrors/npm/
    if ! grep -q "NVM_NODEJS_ORG_MIRROR" "$PROFILE" 2>/dev/null; then
        echo 'export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node/' >> "$PROFILE"
        echo 'export NVM_NPM_MIRROR=https://npmmirror.com/mirrors/npm/' >> "$PROFILE"
    fi
    source "$PROFILE" 2>/dev/null || true
    show_success "NVM 安装完成！"
}

install_nodejs_via_nvm() {
    show_step "1.3" "安装 Node.js" "通过 NVM 安装 Node.js 24.12.0"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 24.12.0
    nvm use 24.12.0
    nvm alias default 24.12.0
    show_success "Node.js 24.12.0 安装完成"
    printf "\n${colorBright}${colorGreen}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colorReset}\n"
    printf "${colorCyan}📦 Node.js: ${colorYellow}$(node --version)${colorReset}\n"
    printf "${colorCyan}📦 NPM:     ${colorYellow}$(npm --version)${colorReset}\n"
    printf "${colorBright}${colorGreen}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colorReset}\n\n"
}

show_step "1.1" "Node.js 版本检查" "检查是否需要安装或更新 Node.js"
if ! check_nodejs_version; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    if ! command -v nvm >/dev/null 2>&1; then
        show_warning "NVM 未安装，需要先安装 NVM"
        install_nvm
    fi
    install_nodejs_via_nvm
    if ! check_nodejs_version; then
        show_error "Node.js 安装失败"
        exit 1
    fi
else
    show_success "Node.js 版本检查通过，跳过安装"
fi

# ──────────────────────────────────────────────────────────────
# 步骤 2：安装 Bun
# ──────────────────────────────────────────────────────────────
show_step "2" "安装 Bun" "安装 Bun 运行时环境"

if command -v bun >/dev/null 2>&1; then
    show_success "Bun 已安装: v$(bun --version)"
else
    show_progress "正在安装 Bun..."
    install_success=false

    if curl -fsSL --connect-timeout 10 "https://bun.sh/install" 2>/dev/null | bash 2>/dev/null; then
        install_success=true
    else
        show_warning "官方源连接失败，尝试国内镜像..."
        bun_install_dir="$HOME/.bun"
        tmp_zip="/tmp/bun-download.zip"
        arch=$(uname -m)
        os_type=$(uname -s | tr '[:upper:]' '[:lower:]')
        bun_pkg=""
        if [[ "$os_type" == "darwin" ]]; then
            [[ "$arch" == "arm64" ]] && bun_pkg="bun-darwin-aarch64.zip" || bun_pkg="bun-darwin-x64.zip"
        elif [[ "$os_type" == "linux" ]]; then
            ([[ "$arch" == "aarch64" ]] || [[ "$arch" == "arm64" ]]) && bun_pkg="bun-linux-aarch64.zip" || bun_pkg="bun-linux-x64.zip"
        fi
        mirrors=(
            "https://registry.npmmirror.com/-/binary/bun/bun-v1.2.1/$bun_pkg"
            "https://ghproxy.com/https://github.com/oven-sh/bun/releases/download/bun-v1.2.1/$bun_pkg"
        )
        for mirror_url in "${mirrors[@]}"; do
            show_progress "尝试镜像: $mirror_url"
            if curl -fsSL --connect-timeout 15 -o "$tmp_zip" "$mirror_url" 2>/dev/null; then
                mkdir -p "$bun_install_dir/bin"
                if unzip -o -q "$tmp_zip" -d "/tmp/bun-extract" 2>/dev/null; then
                    find /tmp/bun-extract -name "bun" -type f -exec mv {} "$bun_install_dir/bin/bun" \;
                    chmod +x "$bun_install_dir/bin/bun"
                    rm -rf /tmp/bun-extract "$tmp_zip"
                    install_success=true
                    show_success "从镜像安装成功"
                    break
                fi
            fi
        done
    fi

    if [ "$install_success" = true ]; then
        export BUN_INSTALL="$HOME/.bun"
        export PATH="$BUN_INSTALL/bin:$PATH"
        if ! grep -q "BUN_INSTALL" "$PROFILE" 2>/dev/null; then
            echo '' >> "$PROFILE"
            echo '# Bun' >> "$PROFILE"
            echo 'export BUN_INSTALL="$HOME/.bun"' >> "$PROFILE"
            echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$PROFILE"
        fi
        command -v bun >/dev/null 2>&1 && show_success "Bun 安装成功: v$(bun --version)" || show_warning "Bun 安装后命令不可用，将使用 npm 作为回退"
    else
        show_warning "Bun 安装失败，将使用 npm 作为回退方案"
    fi
fi

# ──────────────────────────────────────────────────────────────
# 步骤 3：安装 Claude Code
# ──────────────────────────────────────────────────────────────
show_step "3" "安装 Claude Code" "官方脚本安装，失败则回退到 Bun/npm"

show_progress "清理可能存在的旧版本..."
bun uninstall -g @anthropic-ai/claude-code >/dev/null 2>&1 || true
npm uninstall -g @anthropic-ai/claude-code >/dev/null 2>&1 || true

show_progress "尝试使用官方脚本安装 Claude Code..."
_tmp_official=$(mktemp)
_official_ok=false
if curl -fsSL --connect-timeout 15 https://claude.ai/install.sh -o "$_tmp_official" 2>/dev/null \
    && [ -s "$_tmp_official" ] \
    && bash "$_tmp_official"; then
    _official_ok=true
fi
rm -f "$_tmp_official"
if [ "$_official_ok" = true ]; then
    show_success "Claude Code 安装成功（通过官方脚本）！"
else
    show_warning "官方脚本安装失败，切换到 Bun 安装..."
    if bun install -g @anthropic-ai/claude-code; then
        show_success "Claude Code 安装成功（通过 Bun）！"
        # 让 bun 的全局 bin 立即生效，遵循 BUN_INSTALL 规范，默认 ~/.bun/bin
        _bun_global_bin="${BUN_INSTALL:-$HOME/.bun}/bin"
        export PATH="$_bun_global_bin:$PATH"

        show_progress "运行 postinstall 脚本下载 native binary..."
        _pkg_dir="${BUN_INSTALL:-$HOME/.bun}/install/global/node_modules/@anthropic-ai/claude-code"
        postinstall_script=""
        [ -f "$_pkg_dir/install.cjs" ] && postinstall_script="$_pkg_dir/install.cjs" || \
            postinstall_script=$(find "${BUN_INSTALL:-$HOME/.bun}/install/global" -path "*/@anthropic-ai/claude-code/install.cjs" 2>/dev/null | head -1)

        if [ -n "$postinstall_script" ] && [ -f "$postinstall_script" ]; then
            node "$postinstall_script" && show_success "Native binary 下载完成" || \
                show_warning "postinstall 执行失败，请手动运行: node $postinstall_script"
        else
            show_warning "未找到 postinstall 脚本，请手动执行："
            printf "  ${colorCyan}node ~/.bun/install/global/node_modules/@anthropic-ai/claude-code/install.cjs${colorReset}\n"
        fi

        # 修复 bun 已知问题：postinstall 下载完 native binary 后，
        # bun 有时仍不自动创建 ~/.bun/bin/claude 符号链接
        if [ ! -x "$_bun_global_bin/claude" ]; then
            show_progress "检测到 bun 未自动创建符号链接，手动修复..."
            _claude_bin=$(find "$_pkg_dir/bin" -name "claude*" -type f 2>/dev/null | head -1)
            if [ -n "$_claude_bin" ]; then
                ln -sf "$_claude_bin" "$_bun_global_bin/claude"
                show_success "符号链接已创建: $_bun_global_bin/claude -> $_claude_bin"
            else
                show_warning "未找到 claude 二进制文件，请检查安装"
            fi
        fi
    else
        show_error "Claude Code 安装失败"
        exit 1
    fi
fi

ensure_claude_in_path

if command -v claude >/dev/null 2>&1; then
    claude --version >/dev/null 2>&1 && show_success "Claude 命令验证成功" || \
        show_warning "Claude 命令存在但 native binary 可能未就绪，请运行 source $PROFILE 后重试"
else
    show_warning "Claude 命令不可用，请手动执行: source $PROFILE 后重试"
fi

# ──────────────────────────────────────────────────────────────
# 步骤 4：写入配置文件
# ──────────────────────────────────────────────────────────────
show_step "4" "创建配置文件" "将 Key 和 API URL 写入 ~/.claude/settings.json"

mkdir -p "$HOME/.claude"
SETTINGS_FILE="$HOME/.claude/settings.json"

write_settings() {
    if command -v python3 >/dev/null 2>&1; then
        python3 - <<PYEOF
import json

settings_file = '${SETTINGS_FILE}'
token = '${CLAUDE_TOKEN}'
api_url = '${CLAUDE_API_URL}'

try:
    with open(settings_file, 'r') as f:
        data = json.load(f)
except Exception:
    data = {}

data.setdefault('env', {})
data['env'].pop('ANTHROPIC_API_KEY', None)  # 删除可能存在的冲突字段
data['env']['ANTHROPIC_AUTH_TOKEN'] = token
data['env']['ANTHROPIC_BASE_URL'] = api_url
data['env']['API_TIMEOUT_MS'] = 600000
data['env']['CLAUDE_CODE_DISABLE_1M_CONTEXT'] = '1'
data['env']['CLAUDE_CODE_DISABLE_TERMINAL_TITLE'] = '1'
data['env']['CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'] = '1'
data.setdefault('permissions', {'allow': [], 'deny': []})

with open(settings_file, 'w') as f:
    json.dump(data, f, indent=2)
PYEOF
    elif command -v jq >/dev/null 2>&1; then
        tmp=$(mktemp)
        base="{}"
        [ -f "$SETTINGS_FILE" ] && base=$(cat "$SETTINGS_FILE")
        echo "$base" | jq \
            --arg token "${CLAUDE_TOKEN}" \
            --arg url "${CLAUDE_API_URL}" \
            '.env = (.env // {}) |
             del(.env.ANTHROPIC_API_KEY) |
             .env.ANTHROPIC_AUTH_TOKEN = $token |
             .env.ANTHROPIC_BASE_URL = $url |
             .env.API_TIMEOUT_MS = 600000 |
             .env.CLAUDE_CODE_DISABLE_1M_CONTEXT = "1" |
             .env.CLAUDE_CODE_DISABLE_TERMINAL_TITLE = "1" |
             .env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1" |
             .permissions = (.permissions // {"allow":[],"deny":[]})' > "$tmp" && mv "$tmp" "$SETTINGS_FILE"
    else
        [ -f "$SETTINGS_FILE" ] && cp "$SETTINGS_FILE" "$SETTINGS_FILE.bak"
        cat > "$SETTINGS_FILE" <<EOF
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "${CLAUDE_TOKEN}",
    "ANTHROPIC_BASE_URL": "${CLAUDE_API_URL}",
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
EOF
    fi
}

show_progress "写入 settings.json..."
write_settings
show_success "settings.json 配置完成"

# 写入 ~/.claude.json（跳过 onboarding）
CLAUDE_JSON_FILE="$HOME/.claude.json"
show_progress "配置 ~/.claude.json..."
if command -v python3 >/dev/null 2>&1; then
    python3 - <<PYEOF
import json
try:
    with open('${CLAUDE_JSON_FILE}', 'r') as f:
        data = json.load(f)
except Exception:
    data = {}
data['hasCompletedOnboarding'] = True
with open('${CLAUDE_JSON_FILE}', 'w') as f:
    json.dump(data, f, indent=2)
PYEOF
elif command -v jq >/dev/null 2>&1; then
    if [ -f "$CLAUDE_JSON_FILE" ]; then
        jq '.hasCompletedOnboarding = true' "$CLAUDE_JSON_FILE" > "$CLAUDE_JSON_FILE.tmp" && mv "$CLAUDE_JSON_FILE.tmp" "$CLAUDE_JSON_FILE"
    else
        echo '{"hasCompletedOnboarding": true}' > "$CLAUDE_JSON_FILE"
    fi
else
    echo '{"hasCompletedOnboarding": true}' > "$CLAUDE_JSON_FILE"
fi
show_success "~/.claude.json 配置完成"

# ──────────────────────────────────────────────────────────────
# 完成
# ──────────────────────────────────────────────────────────────
printf "\n"
printf "${colorBright}${colorGreen}╔════════════════════════════════════════════════════════╗${colorReset}\n"
printf "${colorBright}${colorGreen}║${colorYellow}               🎉  安装完成！                           ${colorGreen}║${colorReset}\n"
printf "${colorBright}${colorGreen}╠════════════════════════════════════════════════════════╣${colorReset}\n"
printf "${colorBright}${colorGreen}║                                                        ${colorReset}\n"
printf "${colorBright}${colorGreen}║  ${colorCyan}API URL :${colorReset} ${CLAUDE_API_URL}${colorReset}\n"
printf "${colorBright}${colorGreen}║                                                        ${colorReset}\n"
printf "${colorBright}${colorGreen}║  ${colorYellow}下一步：${colorReset}                                           ${colorReset}\n"
printf "${colorBright}${colorGreen}║  ${colorWhite}1. 重新加载 Shell：${colorCyan}source ${PROFILE}${colorReset}\n"
printf "${colorBright}${colorGreen}║  ${colorWhite}2. 启动 Claude Code：${colorCyan}claude${colorReset}\n"
printf "${colorBright}${colorGreen}║                                                        ${colorReset}\n"
printf "${colorBright}${colorGreen}╚════════════════════════════════════════════════════════╝${colorReset}\n"
printf "\n"
