import functions, { app, input, InvocationContext, output } from '@azure/functions';

const tableName = 'notes';

type NoteEntity = {
  PartitionKey: string; // Will hold the topic
  RowKey: string; // Will hold the note itself
};

type NoteDto = { topic: string; content: string };

const entityToDto = ({ PartitionKey, RowKey }: NoteEntity): NoteDto => ({ topic: PartitionKey, content: RowKey });

const allItemsInput = input.table({ tableName, connection: 'AzureWebJobsStorage' });
app.mcpTool('getTopics', {
  toolName: 'get_topics',
  description: 'Get all existing note topics.',
  toolProperties: [],
  extraInputs: [allItemsInput],
  handler: (_, context) => {
    const topics = context.extraInputs.get(allItemsInput) as NoteEntity[];

    const uniqueTopics = new Set(topics.map(({ PartitionKey }) => PartitionKey));
    return Array.from(uniqueTopics);
  },
});

const topicNotes = input.table({ tableName, connection: 'AzureWebJobsStorage', partitionKey: '{mcptoolargs.topic}' });
app.mcpTool('getNotesByTopic', {
  toolName: 'get_notes_by_topic',
  description: 'Get every note stored under a specific topic.',
  toolProperties: { topic: functions.arg.string().describe('The topic to fetch notes for.') },
  extraInputs: [topicNotes],
  handler: async (_toolArguments: unknown, context: InvocationContext) => {
    const noteEntities = context.extraInputs.get(topicNotes) as NoteEntity[];
    return noteEntities.map(entityToDto);
  },
});

const notesOutput = output.table({ tableName, connection: 'AzureWebJobsStorage' });
app.mcpTool('createNote', {
  toolName: 'create_note',
  description: 'Create a new note with a topic and content. ALWAYS, check existing notes before calling this tool to avoid creating duplicates and to reuse existing topics.',
  toolProperties: {
    topic: functions.arg.string().describe('The topic to store the note under.'),
    content: functions.arg.string().describe('The note content.'),
  },
  extraOutputs: [notesOutput],
  handler: async (_toolArguments: unknown, context: InvocationContext) => {
    const { topic, content } = context.triggerMetadata?.mcptoolargs as NoteDto;
    const noteEntity: NoteEntity = { PartitionKey: topic, RowKey: content };
    context.extraOutputs.set(notesOutput, noteEntity);

    return `The note "${content}" with topic [${topic}] has been created.`;
  },
});
