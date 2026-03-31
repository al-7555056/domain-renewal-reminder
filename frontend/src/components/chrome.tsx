import type { ReactNode } from 'react';
import { BrandLogo } from './logo';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  onBrandActivate?: () => void;
};

type StatusBannerProps = {
  tone: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
};

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <BrandLogo compact={compact} title="爱自由域名管理" subtitle="Domain Renewal Reminder Service" />
  );
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  onBrandActivate,
}: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <section className="auth-panel__main">
          <BrandLogo
            title="爱自由域名管理"
            subtitle="Domain Renewal Reminder Service"
            onActivate={onBrandActivate}
          />
          <div className="auth-copy">
            <span className="auth-eyebrow">{eyebrow}</span>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-description">{description}</p>
          </div>
          <div className="auth-body">{children}</div>
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
}

export function StatusBanner({ tone, title, children }: StatusBannerProps) {
  return (
    <div className="status-banner" data-tone={tone}>
      <div className="status-banner__dot" aria-hidden="true"></div>
      <div className="status-banner__content">
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
