import { QuestionWizard } from './components/QuestionWizard';
import { uiConfig } from './data';

function App() {
  const { app_config, theme } = uiConfig;

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: '#f5f5f5' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ color: theme.primary_color }}
          >
            {app_config.title}
          </h1>
          <p className="text-gray-600 text-lg">
            {app_config.description}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Version {app_config.version} | {app_config.source}
          </div>
        </header>

        {/* Main Content */}
        <main>
          <QuestionWizard />
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Based on the official{' '}
            <a
              href="https://ai-act-service-desk.ec.europa.eu/en/eu-ai-act-compliance-checker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              EU AI Act Compliance Checker
            </a>
          </p>
          <p className="mt-2">
            {app_config.disclaimer}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
