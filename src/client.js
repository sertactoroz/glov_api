async function handleRequest(request) {
    console.log("Received request:", request);
}

document.getElementById('apiRequestForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const userId = document.getElementById('userId').value;
    const stream = document.getElementById('stream').value;

    const responseContainer = document.getElementById('responseContainer');
    responseContainer.innerHTML = 'Loading...';

    try {
        const response = await fetch(`https://glov-api.msertactoroz.workers.dev`, {
            // const response = await fetch(`https://glov-api.msertactoroz.workers.dev/?stream=${stream}`, {
            method: 'GET',
            headers: {
                'Authorization': `USER${userId}`,
                'stream': `${stream}`
            },
            mode: 'no-cors'
        });

        const responseData = await response.json();
        responseContainer.innerHTML = JSON.stringify(responseData, null, 2);
    } catch (error) {
        responseContainer.innerHTML = `Error: ${error.message}`;

    }
});
