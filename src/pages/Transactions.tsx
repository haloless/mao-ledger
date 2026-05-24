import emptyRecords from '../../assets/svg/empty-records.svg';
import BilingualHeading from '../components/BilingualHeading';

export default function Transactions() {
  return (
    <section className="page-stack">
      <BilingualHeading zh="收支记录" en="Transactions" level={1} />
      <p className="page-description">每次收入和支出都记下来，进步会看得更清楚。</p>
      <div className="content-card placeholder-illustration-card">
        <img src={emptyRecords} alt="空记录插图" className="placeholder-graphic" />
        <div>
          <h2>记录区准备中</h2>
          <p>之后可以在这里添加收入、支出、分类和备注。</p>
        </div>
      </div>
    </section>
  );
}
