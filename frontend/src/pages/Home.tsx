import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/logo';

const heroSignals = ['分级提醒', 'CSV / AI 导入', '状态同步'];

const heroPanels = [
  {
    label: '资产清单',
    title: '统一管理域名资产',
    description: '域名、到期日、注册商与备注集中归档。',
  },
  {
    label: '提醒策略',
    title: '自动进入提醒周期',
    description: '按到期日生成提醒节奏，减少人工跟踪。',
  },
  {
    label: '续费状态',
    title: '处理过程实时留痕',
    description: '责任人、状态与结果保持同步。',
  },
];

const capabilities = [
  {
    badge: 'Assets',
    title: '统一资产视图',
    description: '域名资产集中整理，信息结构更清晰。',
  },
  {
    badge: 'Automation',
    title: '自动提醒引擎',
    description: '提醒节奏自动计算，减少重复操作。',
  },
  {
    badge: 'Collaboration',
    title: '协作状态同步',
    description: '处理人与续费结果统一留痕。',
  },
];

const flowSteps = ['导入资产', '生成提醒', '更新状态', '续费接续'];

const systemTags = ['Cloudflare 原生部署', '多人协作留痕', '移动端优先'];

export function Home() {
  return (
    <div className="app-shell ink-wash-bg landing-shell landing-shell--executive">
      <a href="#home-main-content" className="skip-link">
        跳到主要内容
      </a>
      <div className="ink-pattern" />
      <div className="landing-orb landing-orb--one" />
      <div className="landing-orb landing-orb--two" />
      <div className="landing-orb landing-orb--three" />

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
            <Link to="/login" className="secondary-button landing-login-button">
              登录
            </Link>
            <Link to="/register" className="primary-button landing-entry-button">
              立即开始
            </Link>
          </nav>
        </div>
      </header>

      <main id="home-main-content" className="app-main landing-main">
        <section className="landing-hero animate-slideUp" aria-labelledby="hero-title">
          <div className="hero-stage liquid-panel">
            <div className="hero-stage__grid">
              <div className="hero-stage__copy">
                <div className="hero-stage__eyebrow">Domain Renewal Control</div>
                <h1 id="hero-title" className="hero-stage__title">收拢域名资产，稳定管理续费周期</h1>
                <p className="hero-stage__description">一个页面完成资产整理、提醒触发与状态同步。</p>

                <div className="landing-actions hero-stage__actions">
                  <Link to="/register" className="primary-button">
                    创建控制台
                  </Link>
                  <Link to="/login" className="secondary-button">
                    进入系统
                  </Link>
                </div>
              </div>

              <aside className="hero-console hero-console--compact" aria-label="Product structure preview">
                <div className="hero-console__top hero-console__top--compact">
                  <div>
                    <div className="hero-console__eyebrow">Product Structure</div>
                    <h2>更少页面，更清晰的续费视图</h2>
                  </div>
                </div>

                <div className="hero-console__stack">
                  {heroPanels.map((item) => (
                    <article key={item.label} className="hero-console__panel">
                      <div className="hero-console__panel-label">{item.label}</div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              </aside>
            </div>

            <div className="hero-signal-band" aria-label="Homepage highlights">
              {heroSignals.map((signal) => (
                <span key={signal} className="hero-signal-band__item">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          className="landing-section landing-section--compact animate-slideUp"
          aria-labelledby="capabilities-title"
        >
          <div className="single-sheet liquid-panel liquid-panel--feature">
            <div className="landing-section__heading landing-section__heading--centered single-sheet__heading">
              <div className="liquid-chip">Core</div>
              <h2 id="capabilities-title">两大分块，覆盖完整续费流程</h2>
              <p>保留必要信息，压缩页面长度，提升浏览效率。</p>
            </div>

            <div className="landing-feature-grid landing-feature-grid--tight">
              {capabilities.map((item) => (
                <article key={item.title} className="liquid-card compact-card compact-card--tight">
                  <div className="liquid-card__badge">{item.badge}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>

            <div className="feature-rail feature-rail--compact">
              <div className="feature-rail__header">
                <div className="liquid-chip">Flow</div>
                <h3>导入到续费接续，全链路自动衔接</h3>
              </div>
              <div className="ops-strip" aria-label="Process steps">
                {flowSteps.map((item) => (
                  <span key={item} className="ops-pill">
                    {item}
                  </span>
                ))}
              </div>
              <div className="feature-tags" aria-label="System tags">
                {systemTags.map((item) => (
                  <span key={item} className="feature-tag">
                    {item}
                  </span>
                ))}
              </div>
              <div className="single-sheet__actions">
                <Link to="/register" className="primary-button">
                  立即注册
                </Link>
                <Link to="/login" className="secondary-button">
                  立即登录
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
