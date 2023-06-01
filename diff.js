function fetchDiff(pullRequest, token) {
    console.log('fetchDiff', 'dddd');
    return new Promise((resolve, reject) => {
        // Retrieve token from local storage
        chrome.storage.local.get('gitlabAccessToken', function(result) {
            let token = result.gitlabAccessToken;

            // Here we assume that pullRequestId is an object containing `projectId` and `mergeRequestId`.
            let url = `https://gitlab.com/api/v4/projects/${pullRequest.projectId}/merge_requests/${pullRequest.mergeRequestId}/diffs`;

            fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.message) {
                    reject(data.message);  // If there's an error message, reject the promise with it.
                } else {
                    resolve(data.changes);  // If the response is successful, resolve the promise with the changes.
                }
            })
            .catch(error => {
                reject(error);  // If there's a network error, reject the promise with it.
            });
        });
    });
}
