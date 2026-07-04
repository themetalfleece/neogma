import Link from 'next/link';
import { highlight } from 'fumadocs-core/highlight';
import { GitHubIcon } from '@/components/icons';
import styles from './page.module.css';

const heroCode = `/* define the user model and its relationships */
@Node({ label: 'User', primaryKeyField: 'id' })
class UserNode extends NodeEntity {
  @Property(Type.String()) id!: string;
  @Property(Type.String()) name!: string;

  @Relationship({ name: 'PLACED', direction: 'out', model: () => OrderNode })
  Orders!: Related<typeof OrderNode>;
}

const Users = neogma.model(UserNode);

/* create a user node, an order node, and their relationship, in one transaction */
const user = await Users.createOne({
  id: '1',
  name: 'Alice',
  Orders: { attributes: [{ id: 'order-1', status: 'confirmed' }] },
});

/* Eager-load relationships in one query */
const found = await Users.findOne({
  where: { name: 'Alice' },
  relationships: { Orders: { where: { target: { status: 'confirmed' } } } },
});
console.log(found?.name);                   // string
console.log(found?.Orders[0].node.status);  // string
// console.log(found?.bogusValue);           // TypeScript error`;

export default async function HomePage() {
  const highlighted = await highlight(heroCode, {
    lang: 'typescript',
  });

  return (
    <main className={styles.hero}>
      <h1 className={styles.title}>
        <img
          src="/favicon.ico"
          alt=""
          width={60}
          height={60}
          style={{ marginRight: '0.75rem', verticalAlign: 'middle' }}
        />
        Neogma
      </h1>
      <p className={styles.subtitle}>
        A fully type-safe Neo4j OGM for TypeScript
      </p>
      <p className={styles.description}>
        Define models with decorators, build queries with a fluent API, and
        manage relationships automatically.
      </p>

      <div className={styles.codeBlock}>{highlighted}</div>

      <div className={styles.actions}>
        <Link href="/docs/latest" className={styles.primaryButton}>
          Get Started
        </Link>
        <a
          href="https://github.com/themetalfleece/neogma"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.secondaryButton}
        >
          <GitHubIcon
            width={18}
            height={18}
            style={{ marginRight: '0.5rem' }}
          />
          GitHub
        </a>
      </div>
    </main>
  );
}
