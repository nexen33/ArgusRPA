<div align="right">
  <a href="./README.md">简体中文</a> | <strong>English</strong>
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

## Unlock Pro Version / 获取完整授权

Loving the 7-day trial? Support the solo dev and grab a key to keep using the Pro version!  
如果您觉得对应 Trial 的 7天试用版 好用的话，欢迎支持独立开发者，继续获取授权密钥以继续使用 Pro 版本！

<div align="center">
  <!-- Buy Me a Coffee (Global Users) -->
  <a href="https://buymeacoffee.com/tunpama/extras" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 144px !important;"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <!-- Afdian (Mainland China Users) -->
  <a href="https://ifdian.net/a/argus" target="_blank"><img src="https://pic1.afdiancdn.com/static/img/welcome/button-sponsorme.png" alt="去爱发电赞助" style="height: 40px !important;width: 144px !important;"></a>
</div>

> **IMPORTANT / 购买须知**:  
> License keys are bound to your hardware ID. Please leave your **[Hardware ID]** in the checkout notes. Keys will be delivered manually via Direct Message / Email within 24 hours.  
> 授权密钥与您的机器码绑定。付款时请务必在订单备注中留下您的 **[机器码]**。您会在 24 小时内通过提供的可用渠道收到您的专属密钥。

## Introduction

**Argus** is a lightweight, visually-driven Robotic Process Automation (RPA) tool and web scraper. Designed with a local-first architecture, it enables automated data extraction and workflow execution without requiring complex scripting.

## Architecture Notice

The UI rendering layer is built with **React 18 + TailwindCSS + Vite**, while the core relies on **Electron** for cross-platform orchestration.  
*(Note: To protect core intellectual property, this repository exclusively open-sources the UI architecture and IPC communication skeleton. All underlying proprietary logic—including the dual Web/Desktop execution engines, anti-fingerprint sandbox, and smart routing algorithms—has been physically isolated. To experience the full capabilities, please use the provided binaries.)*

## Core Features

- **Comprehensive Web Automation (Core)**: A highly mature web automation foundation supporting an extensive array of interaction primitives (e.g., condition branching, local file operations, element actions). Capable of bypassing DOM restrictions via "Network Variable Requests" to fetch API data directly, coupled with dynamic UUID/Token runtime replacement and smart network request interception.
- **Native Desktop Automation (Supplementary - Windows Beta)**: Powered by a zero-dependency local execution runner. Employs a highly reliable dual-picking mechanism combining intelligent image recognition with native UI Automation, providing robust interactions with desktop applications. *(Note: macOS desktop support is currently in development)*.
- **Deep Enterprise IM Integration**: Features a robust WebSocket-based bot communication layer seamlessly integrated with Feishu (including Lark) and Slack. Supports one-click alert script generation, self-healing state management, concurrent alerting pipelines, and dynamic Markdown templating.
- **High-Performance Task Isolation & Gateway**: Powered by a dynamic local API port allocator and robust data validation gateway. Employs high-speed local disk exchange for tasks and true process reuse via a singleton daemon to completely eliminate bottlenecks during mass concurrency.
- **Visual Element Picker with Fallback**: Built-in isolated browser environment supporting dynamic element inspection. Equipped with independent dual-shortcut picking and a unified smart penetration algorithm offering automatic fallback mechanisms, ensuring absolute stability during runtime UI shifts.
- **Node-based Workflow Engine**: Supports sequenced automation logic including pre-click content validation. Greatly reduces manual configuration through one-click import capabilities for Chrome DevTools Recorder files.
- **Smart Popup Evasion**: Implements heuristic element-scoring and keyword matching to automatically bypass intrusive post-navigation popups.
- **Built-in Offline OCR**: Local image-to-text recognition for circumventing canvas-based or non-standard text rendering without relying on cloud APIs.
- **Visual Runtime Monitoring**: Generates real-time, task-specific concurrency charts with straightforward data export options (.csv / .txt).
- **Cron Scheduling**: Background task polling with isolated partition cookies for concurrent multi-account execution.
- **Local Data Privacy & Enterprise Security**: 100% local data persistence with OS-level encrypted storage for sensitive credentials, zero cloud sync, coupled with rigorous anti-tampering protection and strict license verification.

## Installation

**Trial Policy Notice**: To ensure sustainable development and maintain infrastructure, all downloads are provided as a fully unlocked **7-Day Trial Version**. Once the trial period expires, the application will automatically transition into the **Pro Version** state, at which point an authorization key will be required to continue executing workflows. (You can buy an license key from the support buttons at the beginning)

Pre-built binaries for macOS and Windows are available in the [Releases](https://github.com/nexen33/ArgusRPA/releases) page:
- **macOS**: Download `Argus_Trial_Setup_2.0.5_x64.dmg` & `Argus_Trial_Setup_2.0.5_arm64.dmg`.
- **Windows**: Download `Argus_Trial_Setup_2.0.5.exe`.

> **macOS Troubleshooting**: If you encounter an "App is damaged and can't be opened" error, it is due to macOS Gatekeeper's quarantine restrictions on downloaded apps. To resolve this, open your `Terminal`, paste `sudo xattr -cr /Applications/Argus.app`, and hit Enter (you may need to input your Mac login password).

## Disclaimer

Argus is provided "as-is" for educational and personal workflow automation purposes only. The user assumes all responsibility for adhering to the Terms of Service and `robots.txt` policies of the target websites. The author holds no liability for any misuse, account suspension, or legal disputes arising from the use of this software.

---

## UI & Workflow Preview

<p align="center">
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
