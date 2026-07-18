import { Node, NodeEntity, PrimaryKey, Property, Type } from 'neogma/legacy';

@Node({ label: ['ExampleTag', 'Searchable'] })
export class TagNode extends NodeEntity {
  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.String({ minLength: 1 }))
  name!: string;
}
