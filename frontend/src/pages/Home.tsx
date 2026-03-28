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
          <BrandLogo title="爱自有域名管理" subtitle="Domain Renewal Reminder Service" />
          <nav className="landing-nav landing-nav--minimal" aria-label="Homepage actions">
            <Link to="/login" className="primary-button landing-entry-button">
              进入控制台
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main landing-main landing-main--single">
        <section className="home-brief animate-slideUp">
          <div className="home-brief__hero">
            <p className="home-brief__eyebrow">域名续费与提醒管理平台</p>
            <h1 className="home-brief__title">统一管理域名到期周期、提醒策略与续费处理记录</h1>
            <p className="home-brief__description">
              本系统围绕域名续费场景提供用户认证、域名管理、邮件提醒、续费闭环与后台配置能力，
              适用于个人长期维护，也适用于小规模团队协作管理。
            </p>
            <div className="home-brief__annotation">
              <span>面向正式使用场景设计</span>
              <span>支持批量导入、状态管理与处理审计</span>
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
              <div className="home-summary-block__label">产品定位</div>
              <p>用于统一维护域名续费时间、提醒计划与处理状态的轻量化管理服务。</p>
            </div>
            <div className="home-summary-block">
              <div className="home-summary-block__label">核心范围</div>
              <p>用户认证、域名管理、批量导入、提醒调度、邮件通知与管理员配置。</p>
            </div>
            <div className="home-summary-block">
              <div className="home-summary-block__label">运行方式</div>
              <p>基于 Cloudflare 免费资源部署，适合个人与小团队长期稳定使用。</p>
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
