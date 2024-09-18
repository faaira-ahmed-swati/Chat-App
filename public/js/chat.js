const socket = io()  

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebartemplate = document.querySelector('#sidebar-template').innerHTML

//Option
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})


const autoscroll = () => {
    //new message element 
    const $newMessage = $messages.lastElementChild

    //height if new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageheight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleheight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleheight

    if(containerHeight - newMessageheight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('locationMessage',(url) => {
    console.log(url)
    const html = Mustache.render(locationTemplate,{
        username: url.username,
        url: url.text,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('message', (msg) => {
    console.log(msg)
    //to display messages on the browser window instead of console
    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        message : msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})


socket.on('roomData',({room,users}) => {
    const html = Mustache.render(sidebartemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
        e.preventDefault()
        //disable button
        $messageFormButton.setAttribute('disabled','disabled')

        const message = e.target.elements.message.value            //e.target is the form element in this case
        socket.emit('sendMessage',message,(msg) => {
            //enable button after msg is sent to server
            $messageFormButton.removeAttribute('disabled')
            $messageFormInput.value = ''
            $messageFormInput.focus()
            console.log('the message was delivered!',msg)   //msg is acknowledgement from the server
        })
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join',{username,room},(error) => {
    if (error){
        alert(error)
        location.href = '/'
    }
})

 





/* SENDING COUNT TO EVERY CONNECTING CLIENT, AND CLIENT CAN INCREMENT COUNT EXAMPLE */
// socket.on('countUpdated', (count)=> {
//     console.log('The count has been updated ',count)
// }) 

// document.querySelector('#increment').addEventListener('click', () => {
//      console.log('clicked')
//      socket.emit('increment')
// })