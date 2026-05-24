import BilingualHeading from '../components/BilingualHeading';

export default function Contract() {
  return (
    <section className="page-stack">
      <BilingualHeading zh="共识契约" en="Contract" level={1} />
      <p className="page-description">一起约定零花钱规则，花钱前先有小计划。</p>
      <div className="content-card">
        <h2>契约内容准备中</h2>
        <p>这里会放每月金额、储蓄比例和需要商量的消费提醒。</p>
      </div>
    </section>
  );
}
