import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/logo';

const coreCapabilities = [
  {
    title: '统一台账',
    description: '集中维护域名地址、续费链接、使用周期、提醒次数与责任信息。',
  },
  {
    title: '自动提醒',
    description: '系统按计划计算到期时间并执行每日检查，降低遗漏和延迟处理风险。',
  },
  {
    title: '续费闭环',
    description: '完成续费后自动顺延周期、重置提醒进度，并保留处理记录。',
  },
];

const operatingHighlights = [
  ['认证与权限', '支持注册、登录、邮箱验证与管理员入口。'],
  ['部署架构', '基于 Cloudflare Workers、D1、KV 与 Pages 运行。'],
  ['通知方式', '支持 HTTP API 与 SMTP 两类邮件发送配置。'],
];

const processSteps = [
  '录入域名、注册日期、使用周期与提醒参数。',
  '系统自动计算到期日期、提醒起始时间与发送进度。',
  '续费完成后更新状态，并进入新的提醒周期。',
];

export function Home() {
  return (
    <div className="app-shell ink-wash-bg landing-shell landing-shell--executive">
      <div className="ink-pattern" />
      <div className="landing-orb landing-orb--one" />
      <div className="landing-orb landing-orb--two" />

      <header className="app-topbar landing-topbar landing-topbar--minimal">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandLogo title="爱自由域名管理" subtitle="Domain Renewal Reminder Service" />
          <nav className="landing-nav landing-nav--minimal" aria-label="Homepage actions">
            <a
              href="https://github.com/zhikanyeye/domain-renewal-reminder"
              target="_blank"
              rel="noreferrer"
              className="landing-icon-link"
              aria-label="GitHub repository"
              title="GitHub repository"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.59 2 12.25c0 4.528 2.865 8.37 6.839 9.727.5.096.682-.223.682-.495 0-.244-.009-.89-.014-1.747-2.782.62-3.369-1.39-3.369-1.39-.455-1.192-1.11-1.51-1.11-1.51-.908-.638.069-.625.069-.625 1.004.073 1.532 1.058 1.532 1.058.892 1.566 2.341 1.114 2.91.852.091-.667.349-1.115.635-1.371-2.22-.26-4.555-1.14-4.555-5.074 0-1.121.39-2.038 1.03-2.757-.104-.261-.447-1.312.097-2.735 0 0 .84-.276 2.75 1.053A9.303 9.303 0 0 1 12 6.838c.85.004 1.706.118 2.504.347 1.909-1.329 2.748-1.053 2.748-1.053.545 1.423.202 2.474.099 2.735.64.719 1.028 1.636 1.028 2.757 0 3.944-2.339 4.811-4.566 5.066.359.319.679.948.679 1.912 0 1.381-.012 2.494-.012 2.833 0 .274.18.596.688.494C19.138 20.616 22 16.776 22 12.25 22 6.59 17.523 2 12 2Z" />
              </svg>
            </a>
            <Link to="/login" className="primary-button landing-entry-button">
              进入控制台
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main landing-main landing-main--single">
        <section className="home-brief animate-slideUp">
          <div className="home-brief__hero">
            <p className="home-brief__eyebrow">域名续费与提醒管理</p>
            <h1 className="home-brief__title">规范管理域名续费与提醒流程</h1>
            <p className="home-brief__description">
              提供域名台账、到期提醒、续费闭环和后台配置能力，适合个人与小规模团队持续使用。
            </p>
            <div className="home-brief__annotation">
              <span>支持批量导入、状态管理与处理审计</span>
              <span>基于 Cloudflare Workers、D1、KV 与 Pages 部署</span>
            </div>
            <p className="home-brief__subaction">
              首次使用请先
              <Link to="/register" className="inline-link">
                注册账户
              </Link>
              。
            </p>
          </div>

          <aside className="home-brief__summary" aria-label="Product summary">
            <div className="home-summary-block">
              <div className="home-summary-block__label">核心范围</div>
              <p>用户认证、域名管理、批量导入、提醒调度、邮件通知与管理员配置。</p>
            </div>
            <div className="home-summary-block">
              <div className="home-summary-block__label">运行方式</div>
              <p>每日自动检查域名状态，并在续费完成后自动进入新的提醒周期。</p>
            </div>
          </aside>
        </section>

        <section className="home-sheet animate-slideUp" aria-label="Homepage details">
          <div className="home-sheet__column">
            <div className="home-sheet__heading">核心能力</div>
            <div className="home-feature-list">
              {coreCapabilities.map((item) => (
                <article key={item.title} className="home-feature-item">
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="home-sheet__column">
            <div className="home-sheet__heading">处理流程</div>
            <ol className="home-process-list">
              {processSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>

          <div className="home-sheet__column">
            <div className="home-sheet__heading">运行特性</div>
            <dl className="home-definition-list">
              {operatingHighlights.map(([term, detail]) => (
                <div key={term} className="home-definition-item">
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
    </div>
  );
}
