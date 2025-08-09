export async function callKrogerFunction(query) {
  try {
    const response = await fetch(
      'https://kroger-6g5oqpdeea-uc.a.run.app', // Replace with your deployed function URL if different
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Kroger function:', error.message);
    return { error: true, message: error.message };
  }
}
