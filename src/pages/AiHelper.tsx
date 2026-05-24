import iconAiHelper from '../../assets/svg/icon-ai-helper.svg';
import BilingualHeading from '../components/BilingualHeading';

export default function AiHelper() {
  return (
    <section className="page-stack">
      <BilingualHeading zh="AI助手" en="AI Helper" level={1} />
      <p className="page-description">
        遇到选择时，可以让 AI 陪你想一想，再自己做决定。
        <br />
        <small>Get friendly guidance from AI when you need to think things through.</small>
      </p>
      <div className="content-card placeholder-illustration-card">
        <img src={iconAiHelper} alt="AI助手" className="placeholder-graphic" style={{ maxWidth: '120px', opacity: 0.5 }} />
        <div>
          <h2>即将上线 🚀 <small style={{ fontWeight: 400, fontSize: '0.75em', color: 'var(--color-text-muted)' }}>Coming Soon</small></h2>
          <p>
            AI 对话助手正在准备中，敬请期待！可以在"设置"里提前填写 AI Key。
            <br />
            <small>AI conversation helper is on the way. You can add your API key in Settings.</small>
          </p>
        </div>
      </div>
    </section>
  );
}
