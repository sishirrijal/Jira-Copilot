import ForgeUI, {
  Text,
  Button,
  IssuePanel,
  TextArea,
  render,
  useEffect,
  useProductContext,
  useState,
  Fragment,
  Form,
  ModalDialog,
} from '@forge/ui';
import api, { route } from '@forge/api';

const COPILOT_API_URL_SPIN_DESCRIPTION = `https://hackai.mamavanja.com/api/innovators/jira-copilot/spin-description`;
const COPILOT_API_URL_AUTOSUGGEST_DESCRIPTION = `https://hackai.mamavanja.com/api/innovators/jira-copilot/autosuggest-description`;

const App = () => {
  const {
    platformContext: { issueKey },
  } = useProductContext();
  const [copilotDescription, setCopilotDescription] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueType, setIssueType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(async () => {
    const fetchIssueDetails = async () => {
      try {
        const response = await api
          .asApp()
          .requestJira(route`/rest/api/3/issue/${issueKey}`);
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        setIssueTitle(data.fields.summary);
        setIssueType(data.fields.issuetype.name);
      } catch (error) {
        console.error('Failed to fetch issue details:', error);
      }
    };

    await fetchIssueDetails();
  }, []);

  const handleSuggestionChange = async (event) => {
    const copilotDescription = document.getElementById('copilotDescription').value;
    // Make the API call
    const response = await api.fetch(
      `${COPILOT_API_URL_AUTOSUGGEST_DESCRIPTION}?title=${encodeURIComponent(
        issueTitle
      )}&issue_type=${encodeURIComponent(
        issueType
      )}&copilot_description=${encodeURIComponent(
        copilotDescription
      )}`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();
    const descriptionData = data.copilot_description;

    setCopilotDescription(descriptionData);
  };

  const handleUpdateDescription = async (formData) => {
    try {
      const response = await api
        .asApp()
        .requestJira(route`/rest/api/3/issue/${issueKey}`, {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: formData.copilotDescription,
                      },
                    ],
                  },
                ],
              },
            },
          }),
        });

      if (!response.ok) {
        throw new Error(
          `Failed to update issue description with status ${response.status}`
        );
      }

      setModalMessage('Issue has been updated successfully with your content!');
      setIsModalOpen(true);
      console.log('Issue description updated successfully');
    } catch (error) {
      console.error('Failed to update issue description:', error);
      setModalMessage('Failed to update issue!');
      setIsModalOpen(true);
    }
  };

  const handleSpinSuggestion = async () => {
    // Make the API call
    const response = await api.fetch(
      `${COPILOT_API_URL_SPIN_DESCRIPTION}?title=${encodeURIComponent(
        issueTitle
      )}&issue_type=${encodeURIComponent(
        issueType
      )}&copilot_description=${encodeURIComponent(copilotDescription)}`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();
    const descriptionData = data.copilot_description;

    setCopilotDescription(descriptionData);
  };

  return (
    <Fragment>
      {isModalOpen && (
        <ModalDialog
          header="Issue Updated!"
          closeButtonText="OK"
          onClose={() => setIsModalOpen(false)}
        >
          <Text content={modalMessage} />
        </ModalDialog>
      )}
      <Form
        onSubmit={handleUpdateDescription}
        submitButtonText="Update Issue"
        submitButtonAppearance="primary"
        actionButtons={[
          <Button
            icon="premium"
            text="Generate"
            onClick={handleSpinSuggestion}
          />,
        ]}
      >
        <TextArea
          name="copilotDescription"
          isRequired="true"
          placeholder="Start typing ..."
          defaultValue={copilotDescription}
        />
      </Form>
    </Fragment>
  );
};

export const run = render(
  <IssuePanel>
    <App />
  </IssuePanel>
);

