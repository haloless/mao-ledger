import BilingualHeading from '../components/BilingualHeading';

export default function Plan() {
  return (
    <section className="page-stack">
      <BilingualHeading zh="月度计划" en="Monthly Plan" level={1} />
      <p className="page-description">把这个月想做的事先排一排，花钱更安心。</p>
      <div className="content-card">
        <h2>计划卡片准备中</h2>
        <p>这里会展示分类预算、百分比和鼓励提醒。</p>
      </div>
    </section>
  );
}
