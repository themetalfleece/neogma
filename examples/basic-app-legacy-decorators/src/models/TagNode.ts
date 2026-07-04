import { Node, NodeEntity, Property, Type } from 'neogma/legacy';

@Node({ label: ['ExampleTag', 'Searchable'], primaryKeyField: 'id' })
export class TagNode extends NodeEntity {
  @Property(Type.String())
  id!: string;

  @Property(Type.String({ minLength: 1 }))
  name!: string;
}
