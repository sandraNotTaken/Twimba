import { tweetsData } from './data.js'
import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

let deletedTweets = [];

function saveToLocalStorage() {
    localStorage.setItem('tweetsData', JSON.stringify(tweetsData));
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

document.body.addEventListener('dblclick', function() {
    document.body.classList.toggle('dark-mode');
    saveToLocalStorage();
});

document.getElementById('tweet-input').addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleTweetBtnClick();
    }
});

document.getElementById('tweet-input').addEventListener('input', function() {
    autoResizeTextarea(this);
});

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

document.getElementById('image-btn').addEventListener('click', function() {
    document.getElementById('image-input').addEventListener('change', handleImageSelect);
    document.getElementById('image-input').click();
});

document.getElementById('undo-btn').addEventListener('click', handleUndoClick);

function handleUndoClick(){
    if (deletedTweets.length > 0) {
        const tweet = deletedTweets.pop();
        tweetsData.unshift(tweet);
        render();
        saveToLocalStorage();
        if (deletedTweets.length === 0) {
            document.getElementById('undo-container').style.display = 'none';
        }
    }
}

function showUndoButton(){
    document.getElementById('undo-container').style.display = 'block';
}

document.addEventListener('click', function(e){
    const likeEl = e.target.closest('[data-like]');
    if(likeEl){
       handleLikeClick(likeEl.dataset.like) 
    }
    const retweetEl = e.target.closest('[data-retweet]');
    if(retweetEl){
        handleRetweetClick(retweetEl.dataset.retweet)
    }
    const replyEl = e.target.closest('[data-reply]');
    if(replyEl){
        handleReplyClick(replyEl.dataset.reply)
    }
    const deleteEl = e.target.closest('[data-delete]');
    if(deleteEl){
        handleDeleteClick(deleteEl.dataset.delete)
    }
    const editEl = e.target.closest('[data-edit]');
    if(editEl){
        handleEditClick(editEl.dataset.edit)
    }
    else if(e.target.id === 'tweet-btn'){
        handleTweetBtnClick()
    }
})
 
function handleLikeClick(tweetId){ 
    const targetTweetObj = tweetsData.filter(function(tweet){
        return tweet.uuid === tweetId
    })[0]

    if (targetTweetObj.isLiked){
        targetTweetObj.likes--
    }
    else{
        targetTweetObj.likes++ 
    }
    targetTweetObj.isLiked = !targetTweetObj.isLiked
    render()
    saveToLocalStorage();
}

function handleRetweetClick(tweetId){
    const targetTweetObj = tweetsData.filter(function(tweet){
        return tweet.uuid === tweetId
    })[0]
    
    if(targetTweetObj.isRetweeted){
        targetTweetObj.retweets--
    }
    else{
        targetTweetObj.retweets++
    }
    targetTweetObj.isRetweeted = !targetTweetObj.isRetweeted
    render() 
    saveToLocalStorage();
}

function handleEditClick(tweetId){
    const tweet = tweetsData.find(t => t.uuid === tweetId);
    if (!tweet || tweet.handle !== '@Sandra') return;
    
    const newText = prompt('Edit your tweet:', tweet.tweetText);
    if (newText !== null && newText.trim() !== '') {
        tweet.tweetText = newText.trim();
        render();
        saveToLocalStorage();
    }
}

function handleDeleteClick(tweetId){
    const index = tweetsData.findIndex(t => t.uuid === tweetId)

    if (index === -1) {
        console.log('Tweet not found:', tweetId)
        return
    }

    if (!confirm('Are you sure you want to delete this tweet?')) return

    const [deletedTweet] = tweetsData.splice(index, 1) // ✅ mutate
    deletedTweets.push(deletedTweet)

    render()
    saveToLocalStorage()
    showUndoButton()
}


function handleTweetBtnClick(){
    const tweetInput = document.getElementById('tweet-input')

    if( (tweetInput.value.trim() || selectedImage) && !isImageLoading && tweetInput.value.length <= 280){
        console.log('Tweeting with image:', selectedImage ? 'yes' : 'no');
        tweetsData.unshift({
            handle: `@Sandra`,
            profilePic: `images/sandra.jpeg`,
            likes: 0,
            retweets: 0,
            tweetText: tweetInput.value,
            image: selectedImage,
            replies: [],
            isLiked: false,
            isRetweeted: false,
            uuid: uuidv4(),
            createdAt: Date.now()
        })
    render()
    tweetInput.value = ''
    selectedImage = null;
    isImageLoading = false;
    document.getElementById('image-input').value = '';
    document.getElementById('image-btn').textContent = '📷';
    saveToLocalStorage();
    }

}

function getFeedHtml(){
    let feedHtml = ``
    
    tweetsData.forEach(function(tweet){
        
        let likeIconClass = ''
        
        if (tweet.isLiked){
            likeIconClass = 'liked'
        }
        
        let retweetIconClass = ''
        
        if (tweet.isRetweeted){
            retweetIconClass = 'retweeted'
        }
        
        let repliesHtml = ''
        
        if(tweet.replies.length > 0){
            tweet.replies.forEach(function(reply){
                repliesHtml+=`
<div class="tweet-reply">
    <div class="tweet-inner">
        <img src="${reply.profilePic}" class="profile-pic">
            <div>
                <p class="handle">${reply.handle}</p>
                <p class="tweet-text">${highlightText(reply.tweetText)}</p>
            </div>
        </div>
</div>
`
            })
        }
        
        const imageHtml = tweet.image ? `<img src="${tweet.image}" class="tweet-image" alt="Tweet image">` : '';
          
        feedHtml += `
<div class="tweet">
    <div class="tweet-inner">
        <img src="${tweet.profilePic}" class="profile-pic">
        <div>
            <p class="handle">${tweet.handle}</p>
            <p class="tweet-text">${highlightText(tweet.tweetText)}</p>
            ${imageHtml}
            <div class="tweet-meta">
                <span class="timestamp">${getTimeAgo(tweet.createdAt || Date.now())}</span>
            </div>
            <div class="tweet-details">
                <span class="tweet-detail">
                    <i class="fa-regular fa-comment-dots" data-reply="${tweet.uuid}"></i>
                    ${tweet.replies.length}
                </span>
                <span class="tweet-detail">
                    <i class="fa-solid fa-heart ${likeIconClass}" data-like="${tweet.uuid}"></i>
                    ${tweet.likes}
                </span>
                <span class="tweet-detail">
                    <i class="fa-solid fa-retweet ${retweetIconClass}" data-retweet="${tweet.uuid}"></i>
                    ${tweet.retweets}
                </span>
                <span class="tweet-detail">
                    <i class="fa-solid fa-trash-can" data-delete="${tweet.uuid}"></i>
                </span>
                ${tweet.handle === '@Sandra' ? `<span class="tweet-detail">
                    <i class="fa-solid fa-edit" data-edit="${tweet.uuid}"></i>
                </span>` : ''}
            </div>   
        </div>            
    </div>
    <div class="hidden" id="replies-${tweet.uuid}">
        ${repliesHtml}
    </div>   
</div>
`
   })
   return feedHtml 
}

let selectedImage = null;
let isImageLoading = false;

function handleImageSelect(e) {
    const file = e.target.files[0];
    console.log('File selected:', file);
    if (file && file.type.startsWith('image/')) {
        isImageLoading = true;
        document.getElementById('image-btn').textContent = '📷...';
        const reader = new FileReader();
        reader.onload = function(event) {
            selectedImage = event.target.result;
            isImageLoading = false;
            console.log('Image data URL set, length:', event.target.result.length);
            document.getElementById('image-btn').textContent = '📷✓';
        };
        reader.onerror = function() {
            isImageLoading = false;
            console.log('Error reading file');
            document.getElementById('image-btn').textContent = '📷';
        };
        reader.readAsDataURL(file);
    } else {
        console.log('Selected file is not an image');
    }
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
}

function highlightText(text) {
    return text
        .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
        .replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

function render(){
    document.getElementById('feed').innerHTML = getFeedHtml()
}

if (localStorage.getItem('tweetsData')) {
    tweetsData.splice(0, tweetsData.length, ...JSON.parse(localStorage.getItem('tweetsData')));
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

render()

