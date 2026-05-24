import BilingualHeading from '../components/BilingualHeading';

export default function AiHelper() {
  return (
    <section className="page-stack">
      <BilingualHeading zh="AI助手" en="AI Helper" level={1} />
      <p className="page-description">遇到选择时，可以让 AI 陪你想一想，再自己做决定。</p>
      <div className="content-card">
        <h2>对话助手准备中</h2>
        <p>这里会提供鼓励式建议、花费回顾和简单提问入口。</p>
      </div>
    </section>
  );
}
