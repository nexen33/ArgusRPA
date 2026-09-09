<div align="right">
  <strong>简体中文</strong> | <a href="./README_EN.md">English</a>
</div>

<h1 align="center">Argus RPA</h1>

<p align="center">
  <a href="https://github.com/nexen33/ArgusRPA/releases"><img src="https://img.shields.io/badge/Version-v2.0.5-blue" alt="Version" /></a>
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-green" alt="Platform" />
  <img src="https://img.shields.io/badge/Electron-v30-teal" alt="Electron" />
  <img src="https://img.shields.io/badge/React-v18-cyan" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-v5.4-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-7--Day%20Trial%20%7C%20Pro-orange" alt="License" />
</p>

---

### 🔑 Unlock Pro Version / 获取完整授权<br/>
Loving the 7-day trial? Support the solo dev and grab a key to keep using the Pro version!<br/>
如果您觉得对应 Trial 的 7天试用版 好用的话，欢迎支持独立开发者，继续获取授权密钥以继续使用 Pro 版本！

<div align="center">
  <!-- Buy Me a Coffee (Global Users) -->
  <a href="https://buymeacoffee.com/tunpama/extras" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 144px !important;"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <!-- Afdian (Mainland China Users) -->
  <a href="https://ifdian.net/a/argus" target="_blank"><img src="https://pic1.afdiancdn.com/static/img/welcome/button-sponsorme.png" alt="去爱发电赞助" style="height: 40px !important;width: 144px !important;"></a>
</div>

<br/>

> ⚠️ **IMPORTANT / 购买须知**：<br/>
> License keys are bound to your hardware ID. Please leave your **[Hardware ID]** in the checkout notes. Keys will be delivered manually via Direct Message / Email within 24 hours.<br/>
> 授权密钥与您的机器码绑定。付款时请务必在订单备注中留下您的 **[机器码]**。您会在 24 小时内通过提供的可用渠道收到您的专属密钥。

---

Argus 是一款轻量级、视觉驱动的 桌面级 RPA 与 网页数据 提取工具。项目采用完全本地化的架构设计，无需编写复杂脚本即可实现自动化的工作流调度。

### 🛠️ 架构说明
本项目的 UI 渲染层采用了 **React 18 + TailwindCSS + Vite** 构建，底层基于 **Electron** 实现跨平台调度。<br>
*(注：为保护核心知识产权与商业逻辑，本仓库目前仅开源 UI 渲染架构与 IPC 通信骨架。包含 Web/Desktop 双轨执行引擎、防指纹沙盒及智能调度算法在内的所有核心底层源码均已进行物理隔离。如需体验完整自动化能力，请使用上方提供的安装包。)*

### ✨ 核心功能
- **全能型网页自动化 (核心):** 拥有极度成熟的 Web 自动化底座，全面支持超过二十余种自动化原语（包含条件分支、本地文件流处理、模拟交互等）。支持突破常规 DOM 限制，新增通过“网络变量请求”直取底层接口数据，并具备智能网络响应拦截与运行时 Token 动态替换能力。
- **桌面自动化 (辅助延伸 - Windows Beta):** 搭载纯本地零依赖的执行核心，通过智能图像识别与系统原生控件（UIA）的双轨拾取机制，实现高可用性的桌面应用自动化流转。*(注：macOS 桌面端底层目前仍在研发适配中)*。
- **企业级协同 IM 深度绑定:** 内置高性能 WebSocket 机器人通讯底座，完美集成飞书 (包括Lark) 与 Slack。原生支持一键生成自动化推送脚本、底层状态破损自愈、多路并发告警拦截以及灵活的 Markdown 模板注入机制。
- **高性能任务调度与数据网关:** 具备本地 API 端口动态分配能力与强大的安全数据网关；桌面级任务完全采用高速本地磁盘数据交换与守护进程“真复用”机制，彻底解决海量多任务并发时的性能瓶颈。
- **双轨可视化元素拾取:** 内置隔离沙盒浏览器，支持通过悬停实时解析页面结构。搭载独立双快捷键拾取与“智能穿透”算法，点击与输入操作无缝支持底层驱动与页面代码级的降级兜底，应对极端页面重绘场景游刃有余。
- **智能流程编排引擎:** 提供完整的逻辑闭环（包括执行前内容校验），并支持一键导入浏览器原生录制文件，极大程度降低用户的手工配置成本。
- **启发式弹窗规避:** 采用元素面积计算与特征打分机制，静默检测并自动关闭登录后的各类强插屏干扰弹窗。
- **纯离线内置 OCR:** 无需连接云端，针对 Canvas 渲染或非标准文本执行纯本地的图像到文本识别提取。
- **可视化运行监控:** 为并发任务生成实时的可视化监控数据图表，并提供原生格式导出（.csv / .txt）。
- **后台调度与沙盒隔离:** 支持细粒度的定时轮询任务，且为每个批次任务分配独立的隔离环境，实现多账号并发免串签。
- **本地强隐私与企业级防护:** 运行数据及核心凭证采取系统级最高加密标准全量落地本地，零云端上传；底层融合了深度代码防篡改与强授权校验机制。

### 🚀 下载与安装 
**⚠️ 试用政策说明：** 为了维持本项目的长久研发与底层运维，当前提供的所有安装包均为全功能解锁的 **7 天 Trial 试用版**。当试用期结束后，软件会自动平滑过渡至 **Pro 专业版** 锁定状态，届时将需要持有有效的授权密钥方可继续执行您的自动化流转任务。感谢您对独立开发者的理解。（授权密钥可以从开头的支持链接处获取）

请前往 [Releases](https://github.com/nexen33/ArgusRPA/releases) 页面获取编译好的安装包：
- **macOS:** 下载 `Argus_Trial_Setup_2.0.5_x64.dmg` 或 `Argus_Trial_Setup_2.0.5_arm64.dmg`。
- **Windows:** 下载 `Argus_Trial_Setup_2.0.5.exe`。

> 🔧 **macOS 运行提示：** 若安装后打开时提示“App 已损坏，无法打开”，这是由于 macOS Gatekeeper 的安全隔离机制所致。请打开系统的 `终端 (Terminal)`，粘贴命令 `sudo xattr -cr /Applications/Argus.app` 并回车，输入开机密码后即可正常使用。

### ⚠️ 免责声明 (Disclaimer)
本软件按“原样”提供，仅供个人学习、技术研究及合法的工作流自动化使用。用户在使用本软件时，必须严格遵守目标网站的《服务条款》(ToS) 及 `robots.txt` 爬虫协议。因滥用本软件（包括但不限于高频抓取、逆向破解等）导致的目标网站服务异常、账号封禁或任何相关法律纠纷，软件开发者不承担任何直接或连带法律责任。

---

<p align="center">
  <!-- 这里放你刚生成的新图片链接 -->
  <img width="7550" height="2250" alt="Image" src="https://github.com/user-attachments/assets/612142cc-2109-47d1-8560-5571ecea7286" />
</p>

<p align="center">
  <img width="7550" height="2250" alt="Image" src="https://github.com/user-attachments/assets/af46f871-6df4-4b43-b1b4-863f9b6dce31" />
</p>

<p align="center">
  <em>Viel Spaß damit!</em><br />
  <em>Entwickelt mit ❤️ von Tun&PaMa Familie</em><br />
  <em>Copyright © 2026 Tun & PaMa AG</em>
</p>
