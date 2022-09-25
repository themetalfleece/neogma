# Models Overview

Models provide lots of functions to automate creating, reading, updating, and deleting nodes and relationships. Every time a node is created or fetched from the database, an [Instance](./Instances) of this Model is created and provides access to its properties and other helper methods.

To provide that functionality, a model definition needs the following configuration:
* The label(s) that the nodes have.
* All its potential relationships with other models (even itself).
* A schema with the nodes' properties and validation for them.
* (optional) Statics (for the Model) and methods (for the Instance).
* (optional) A primary key field. The values of this field will be used as a unique identifier for the nodes, which will enable some methods to be used.

Examples can be found next.

> :ToCPrevNext