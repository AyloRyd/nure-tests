(() => {
    function createOutputContainer() {
      const existingContainer = document.getElementById('quiz-parser-output');
      if (existingContainer) {
        existingContainer.remove();
      }
      const container = document.createElement('div');
      container.id = 'quiz-parser-output';
      container.style.position = 'fixed';
      container.style.top = '10px';
      container.style.right = '10px';
      container.style.width = '400px';
      container.style.height = '80%';
      container.style.backgroundColor = 'white';
      container.style.border = '1px solid #ccc';
      container.style.borderRadius = '5px';
      container.style.padding = '10px';
      container.style.zIndex = '9999';
      container.style.overflow = 'auto';
      container.style.fontFamily = 'monospace';
      container.style.fontSize = '12px';
      container.style.whiteSpace = 'pre-wrap';
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'row-reverse';
      buttonContainer.style.gap = '5px';
      function createButton(text, onClick) {
          const button = document.createElement('button');
          button.textContent = text;
          button.style.padding = '5px 10px';
          button.style.cursor = 'pointer';
          button.addEventListener('click', onClick);
          return button;
      }
      const closeButton = createButton('Close', () => container.remove());
      buttonContainer.appendChild(closeButton);
      const copyButton = createButton('Copy Output', () => {
          const content = document.getElementById('quiz-parser-content');
          if (content) {
              navigator.clipboard.writeText(content.textContent)
              .then(() => appendToLogs('Quiz data copied to clipboard!'))
              .catch(err => console.error('Failed to copy:', err));
          }
      });
      buttonContainer.appendChild(copyButton);
      const gptCopyButton = createButton('Copy Output for GPT', () => {
          const content = document.getElementById('quiz-parser-content');
          const prompt = 'Answer only in the format: **{question_number}. {question_text}**\\n{correct_options}, where the correct options are listed with both their text and identifier.\n---';
          if (content) {
              navigator.clipboard.writeText(`${prompt}\n\n` + content.textContent)
              .then(() => appendToLogs('Quiz data copied to clipboard!'))
              .catch(err => console.error('Failed to copy:', err));
          }
      });
      buttonContainer.appendChild(gptCopyButton);
      container.appendChild(buttonContainer);
      const logsDiv = document.createElement('div');
      logsDiv.id = 'quiz-parser-logs';
      logsDiv.style.marginTop = '10px';
      logsDiv.style.maxHeight = '150px';
      logsDiv.style.overflow = 'auto';
      logsDiv.style.fontSize = '10px';
      logsDiv.style.borderTop = '1px solid #ddd';
      container.appendChild(logsDiv);
      const contentDiv = document.createElement('div');
      contentDiv.id = 'quiz-parser-content';
      contentDiv.style.marginTop = '30px';
      container.appendChild(contentDiv);
      document.body.appendChild(container);
    }
    function appendToOutput(text) {
      const contentDiv = document.getElementById('quiz-parser-content');
      if (contentDiv) {
        contentDiv.textContent = text;
      }
    }
    function appendToLogs(text) {
      const logsDiv = document.getElementById('quiz-parser-logs');
      if (!logsDiv) return;
      logsDiv.textContent += text + '\n';
      logsDiv.scrollTop = logsDiv.scrollHeight;
    }
    function getQuestion(container) {
      const questionElement = container.querySelector('.qtext');
      return questionElement ? questionElement.textContent.trim() : 'No question found';
    }
    function getAnswersType(container) {
      const answerContainer = container.querySelector('.answer');
      if (!answerContainer) return 'Unknown';
      const radioInputs = answerContainer.querySelectorAll('input[type="radio"]');
      const checkboxInputs = answerContainer.querySelectorAll('input[type="checkbox"]');
      if (radioInputs.length > 0) {
        return 'SingleAnswer';
      } else if (checkboxInputs.length > 0) {
        return 'MultipleAnswer';
      } else {
        return 'Unknown';
      }
    }
    function getAnswers(container) {
      const answers = [];
      const answerElements = container.querySelectorAll('[data-region="answer-label"]');
      answerElements.forEach((element, index) => {
        answers.push(element.textContent.trim());
      });
      return answers;
    }
    function processPage(doc, quizData, questionIndex) {
      const questionContainers = doc.querySelectorAll('.que');
      questionContainers.forEach(container => {
        const questionText = getQuestion(container);
        const answersType = getAnswersType(container);
        const answers = getAnswers(container);
        quizData.push({
          question: questionText,
          type: answersType,
          answers: answers,
          index: questionIndex + 1
        });
      });
      return questionContainers.length;
    }
    function formatQuizData(quizData) {
      let formattedOutput = '';
      quizData.forEach(item => {
        formattedOutput += `Question #${item.index} [${item.type.toLowerCase()}]\n`;
        formattedOutput += `${item.question}\n`;
        item.answers.forEach(answer => {
          formattedOutput += `${answer}\n`;
        });
        formattedOutput += '---\n';
      });
      return formattedOutput;
    }
    function generatePageUrl(baseUrl, params, pageNum) {
      const urlObj = new URL(baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.set(key, value);
      });
      urlObj.searchParams.set('page', pageNum);
      return urlObj.toString();
    }
    async function runQuizParser() {
      try {
        createOutputContainer();
        const currentUrl = window.location.href;
        const urlObj = new URL(currentUrl);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
        const params = Object.fromEntries(urlObj.searchParams.entries());
        const questionButtons = document.querySelectorAll('.qnbutton');
        const totalQuestions = questionButtons.length;
        console.log(`Found ${totalQuestions} questions in total`);
        appendToLogs(`Found ${totalQuestions} questions in total. Starting extraction...`);
        const quizData = [];
        let questionIndex = 0;
        for (let pageNum = 0; pageNum < totalQuestions; pageNum++) {
          const pageUrl = generatePageUrl(baseUrl, params, pageNum);
          console.log(`Processing page ${pageNum}/${totalQuestions}: ${pageUrl}`);
          appendToLogs(`Processing page ${pageNum}/${totalQuestions}...`);
          try {
            const response = await fetch(pageUrl);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const questionsProcessed = processPage(doc, quizData, questionIndex);
            questionIndex += questionsProcessed;
          } catch (error) {
            console.error(`Error processing page ${pageNum}:`, error);
            appendToLogs(`Error processing page ${pageNum}: ${error.message}`);
          }
        }
        const output = formatQuizData(quizData);
        appendToOutput(output);
        console.log('Quiz parsing complete!');
        appendToLogs('Quiz parsing complete!');
        return output;
      } catch (error) {
        console.error('Error running Quiz Parser:', error);
        appendToLogs('Error running Quiz Parser: ' + error.message);
      }
    }
    runQuizParser();
  })();