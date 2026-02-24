# 邮件服务配置指南

## 重要更新

**Cloudflare Workers 现在支持 TCP Sockets！** 这意味着理论上可以实现 SMTP 客户端。

### 限制

- ❌ **端口 25 被禁止**（SMTP 默认端口）
- ✅ **端口 465（SMTPS）和 587（STARTTLS）可用**
- ⚠️ **需要自己实现 SMTP 协议**（复杂）

### 推荐方案

虽然技术上可行，但**强烈推荐使用 HTTP API 的邮件服务**，原因：
1. 实现 SMTP 协议非常复杂
2. HTTP API 更简单、更可靠
3. 免费额度足够使用
4. 有完善的文档和支持

---

## 方案对比

| 方案 | 难度 | 可靠性 | 推荐度 |
|------|------|--------|--------|
| HTTP API（Resend/SendGrid） | ⭐ 简单 | ⭐⭐⭐⭐⭐ 高 | ✅ 强烈推荐 |
| TCP Socket + SMTP | ⭐⭐⭐⭐⭐ 复杂 | ⭐⭐⭐ 中 | ⚠️ 不推荐 |
| 飞升邮箱 SMTP | ❌ 不可用（端口 25） | - | ❌ 无法使用 |

---

## 推荐方案

### 方案 1: Resend（推荐，最简单）

[Resend](https://resend.com) 提供简单的 HTTP API，免费额度：100 封/天

**步骤：**

1. 注册 Resend 账号
2. 获取 API Key
3. 在管理员面板配置：
   - SMTP 服务器：`api.resend.com`
   - 端口：`443`
   - 用户名：留空
   - 密码：你的 Resend API Key
   - 发件人邮箱：`noreply@yourdomain.com`（需要验证域名）

**代码实现：**

修改 `src/services/email.ts` 的 `sendEmail` 方法：

```typescript
async sendEmail(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.smtpConfig.password}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.smtpConfig.fromName} <${this.smtpConfig.fromEmail}>`,
        to: [to],
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    await this.logEmailError(to, subject, error);
    return {
      success: false,
      error: {
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

---

### 方案 2: SendGrid

[SendGrid](https://sendgrid.com) 免费额度：100 封/天

**步骤：**

1. 注册 SendGrid 账号
2. 创建 API Key
3. 在管理员面板配置：
   - SMTP 服务器：`api.sendgrid.com`
   - 端口：`443`
   - 用户名：留空
   - 密码：你的 SendGrid API Key
   - 发件人邮箱：已验证的邮箱

**代码实现：**

```typescript
async sendEmail(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.smtpConfig.password}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
        }],
        from: {
          email: this.smtpConfig.fromEmail,
          name: this.smtpConfig.fromName,
        },
        subject: subject,
        content: [{
          type: 'text/html',
          value: htmlBody,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    await this.logEmailError(to, subject, error);
    return {
      success: false,
      error: {
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

---

### 方案 3: Mailgun

[Mailgun](https://www.mailgun.com) 免费额度：5,000 封/月（前3个月）

**步骤：**

1. 注册 Mailgun 账号
2. 获取 API Key 和域名
3. 在管理员面板配置：
   - SMTP 服务器：`api.mailgun.net`
   - 端口：`443`
   - 用户名：`api`
   - 密码：你的 Mailgun API Key
   - 发件人邮箱：`noreply@你的mailgun域名`

**代码实现：**

```typescript
async sendEmail(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
  try {
    const domain = 'mg.yourdomain.com'; // 你的 Mailgun 域名
    const auth = btoa(`api:${this.smtpConfig.password}`);
    
    const formData = new FormData();
    formData.append('from', `${this.smtpConfig.fromName} <${this.smtpConfig.fromEmail}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', htmlBody);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mailgun API error: ${error}`);
    }

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    await this.logEmailError(to, subject, error);
    return {
      success: false,
      error: {
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

---

## 关于飞升邮箱

飞升邮箱提供的是传统 SMTP 服务。

**问题：**
1. 如果使用端口 25 → ❌ Cloudflare Workers 禁止端口 25
2. 如果使用端口 465/587 → ✅ 技术上可行，但需要实现完整的 SMTP 协议

**解决方案：**

### 方案 A: 使用推荐的邮件服务（简单）

使用 Resend/SendGrid/Mailgun 等提供 HTTP API 的服务。

### 方案 B: 实现 SMTP 客户端（复杂，不推荐）

如果你坚持使用飞升邮箱，需要：

1. 确认飞升邮箱支持端口 465 或 587
2. 使用 Cloudflare Workers 的 TCP Socket API
3. 实现完整的 SMTP 协议（包括 EHLO、AUTH、MAIL FROM、RCPT TO、DATA 等命令）
4. 处理 TLS/SSL 加密
5. 处理各种错误情况

**示例代码框架**（仅供参考，需要完整实现）：

```typescript
import { connect } from 'cloudflare:sockets';

async function sendSMTPEmail(config: SmtpConfig, to: string, subject: string, body: string) {
  // 连接到 SMTP 服务器（端口 465 或 587）
  const socket = connect({
    hostname: config.host,
    port: config.port,
  }, {
    secureTransport: config.port === 465 ? 'on' : 'starttls'
  });

  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  try {
    // 1. 读取服务器欢迎消息
    // 2. 发送 EHLO 命令
    // 3. 如果是 587 端口，发送 STARTTLS 并升级连接
    // 4. 发送 AUTH LOGIN 命令
    // 5. 发送用户名和密码（Base64 编码）
    // 6. 发送 MAIL FROM 命令
    // 7. 发送 RCPT TO 命令
    // 8. 发送 DATA 命令
    // 9. 发送邮件内容
    // 10. 发送 QUIT 命令
    
    // 这需要实现完整的 SMTP 协议，非常复杂
    // 建议使用现成的邮件服务 API
    
  } finally {
    await writer.close();
    await socket.close();
  }
}
```

**为什么不推荐：**
- SMTP 协议实现复杂，容易出错
- 需要处理各种边界情况
- 调试困难
- 维护成本高
- HTTP API 更简单可靠

---

## 实施步骤

### 1. 选择邮件服务

推荐 Resend，因为：
- 配置最简单
- API 最友好
- 免费额度够用
- 文档清晰

### 2. 修改代码

根据你选择的服务，修改 `src/services/email.ts` 中的 `sendEmail` 方法。

### 3. 重新部署后端

```bash
npm run deploy
```

### 4. 配置 SMTP

在管理员面板中配置相应的 SMTP 设置。

### 5. 测试邮件发送

注册一个新账号，检查是否收到验证邮件。

---

## 测试邮件发送

### 方法 1: 通过注册测试

1. 访问前端注册页面
2. 使用你的邮箱注册
3. 检查邮箱是否收到验证邮件

### 方法 2: 通过 API 测试

```bash
curl -X POST "https://你的worker地址.workers.dev/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test1234"}'
```

### 方法 3: 查看日志

```bash
wrangler tail
```

查看邮件发送的日志输出。

---

## 常见问题

### Q: 为什么不能直接使用 SMTP？

A: Cloudflare Workers 运行在边缘网络，出于安全和性能考虑，只支持 HTTP/HTTPS 协议，不支持 SMTP、FTP 等传统协议。

### Q: 免费邮件服务够用吗？

A: 对于个人使用或小型应用，完全够用：
- Resend: 100 封/天 = 3,000 封/月
- SendGrid: 100 封/天 = 3,000 封/月
- Mailgun: 5,000 封/月（前3个月）

### Q: 如何验证发件人域名？

A: 在邮件服务提供商的控制面板中：
1. 添加你的域名
2. 添加 DNS 记录（通常是 TXT 和 CNAME）
3. 等待验证完成（通常几分钟到几小时）

### Q: 邮件进入垃圾箱怎么办？

A: 
1. 确保发件人域名已验证
2. 配置 SPF、DKIM、DMARC 记录
3. 避免使用垃圾邮件常用词汇
4. 提供退订链接

---

## 推荐配置（Resend）

这是最简单的配置方案：

1. **注册 Resend**: https://resend.com
2. **获取 API Key**: Dashboard > API Keys > Create API Key
3. **修改代码**: 使用上面的 Resend 代码实现
4. **部署**: `npm run deploy`
5. **配置管理员面板**:
   - SMTP 服务器: `api.resend.com`
   - 端口: `443`
   - 用户名: 留空
   - 密码: 你的 API Key
   - 发件人邮箱: `noreply@yourdomain.com`
   - 发件人名称: `爱自由域名管理`

完成！
