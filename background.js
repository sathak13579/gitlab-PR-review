chrome.runtime.onInstalled.addListener(function () {
    console.log("GitLab PR Code Diff extension installed successfully.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'fetch_diff') {
        console.log('Fetching diff for:', request.pullRequestId);
        fetchDiff(request.pullRequestId)
            .then(diff => {
                chrome.runtime.sendMessage({ message: 'diff_fetched', diff: diff });
                console.log('Diff sent:', diff);
            })
            .catch(error => {
                chrome.runtime.sendMessage({ message: 'error_fetching_diff', error: error });
            });
    }

    if (request.message === 'save_token') {
        console.log('Saving token: ' + request.token);
        saveToken(request.token);
    }
});

function saveToken(token) {
    chrome.storage.local.set({gitlabAccessToken: token}, function() {
        console.log('Access token is saved in local storage.');
    });
}

function fetchDiff(pullRequestId) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('gitlabAccessToken', function(result) {
            let token = result.gitlabAccessToken;
            let url = `https://gitlab.com/api/v4/projects/${pullRequestId.projectId}/merge_requests/${pullRequestId.mergeRequestId}/diffs?private_token=${token}`;

            fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    reject(data.message);
                } else {
                    resolve(data);
                }
            })
            .catch(error => {
                reject(error);
            });
        });
    });
}

// function fetchMergeRequests(pullRequestId) {
//     console.log('fetchMergeRequests', pullRequestId);
//     return new Promise((resolve, reject) => {
//         chrome.storage.local.get('gitlabAccessToken', function(result) {
//             let token = result.gitlabAccessToken;
//             let url = `https://gitlab.com/api/v4/projects/${pullRequestId.projectId}/merge_requests`;

//             fetch(url, {
//                 headers: {
//                     'Authorization': `Bearer ${token}`
//                 }
//             })
//             .then(response => response.json())
//             .then(data => {
//                 if (data.message) {
//                     reject(data.message);
//                 } else {
//                     resolve(data);
//                 }
//             })
//             .catch(error => {
//                 reject(error);
//             });
//         });
//     });
// }
