import logoMark from '../assets/logo-mark.svg';

type BrandLogoProps = {
  compact?: boolean;
  center?: boolean;
  title?: string;
  subtitle?: string;
  iconOnly?: boolean;
  onActivate?: () => void;
};

export function BrandLogo({
  compact = false,
  center = false,
  title = '爱自由域名管理',
  subtitle = 'Domain Renewal Reminder Service',
  iconOnly = false,
  onActivate,
}: BrandLogoProps) {
  const className = ['brand-mark', compact ? 'compact' : '', center ? 'brand-mark--center' : '']
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <div className="brand-mark__icon" aria-hidden="true">
        <img src={logoMark} alt="" className="brand-mark__icon-image" />
      </div>
      {!iconOnly ? (
        <div className="brand-mark__copy">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
      ) : null}
    </>
  );

  if (onActivate) {
    return (
      <button type="button" className={`${className} brand-mark__button`} onClick={onActivate}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
