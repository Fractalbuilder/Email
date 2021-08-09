document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email("", "", ""));

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector("#compose-form").onsubmit = sendEmail;
});

function compose_email(recipients, subject, body) {
  // Show compose view and hide other views
  hideAllViews();
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

function load_mailbox(mailbox) {
  hideAllViews();
  
  currentView = document.querySelector('#' + mailbox + '-view');
  viewTitle = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  currentView.innerHTML = viewTitle;

  if (mailbox == "inbox") {
    fetch('/emails/inbox')
      .then(response => response.json())
      .then(emails => {
        emails.forEach(email => {
          let elementId = 'inboxElement' + email.id;

          AddElement(currentView, email, elementId);
          document.querySelector('#' + elementId).addEventListener('click', () => ShowEmail(email.id, 'inbox'));
        });
    });
  } else if (mailbox == "archive") {
    fetch('/emails/archive')
      .then(response => response.json())
      .then(emails => {
        emails.forEach(email => {
          let elementId = 'archivedElement' + email.id;
            
          AddElement(currentView, email, elementId);
          document.querySelector('#' + elementId).addEventListener('click', () => ShowEmail(email.id, 'archive'));
        });
    });
  } else if (mailbox == "sent") {
    fetch('/emails/sent')
      .then(response => response.json())
      .then(emails => {
        emails.forEach(email => {
          let elementId = 'sentElement' + email.id;

          var element = document.createElement("div");
          element.setAttribute("id", elementId);
          element.setAttribute("class", "emailListElement row");
          currentView.appendChild(element);

          var recipientsComponent = document.createElement("div");
          recipientsComponent.setAttribute("class", "elementComponent col-md-3 col-lg-3");
          recipientsComponent.innerHTML = "<b>" + email.recipients + "</b>";
          element.appendChild(recipientsComponent);

          var subjectComponent = document.createElement("div");
          subjectComponent.setAttribute("class", "elementComponent col-md-7 col-lg-7");
          subjectComponent.innerHTML = email.subject;
          element.appendChild(subjectComponent);

          var timeComponent = document.createElement("div");
          timeComponent.setAttribute("class", "elementComponent col-md-2 col-lg-2");
          timeComponent.setAttribute("style", "color: grey");
          timeComponent.innerHTML = email.timestamp;
          element.appendChild(timeComponent);

          document.querySelector('#' + elementId).addEventListener('click', () => ShowEmail(email.id, 'sent'));
        });
    });
  }

  currentView.style.display = 'block';
}

function hideAllViews() {
  views = document.querySelectorAll('.view');

  views.forEach(view => {
    view.style.display = 'none';
  });
}

function sendEmail () {
  recipients = document.querySelector("#compose-recipients").value;
  subject = document.querySelector("#compose-subject").value;
  body = document.querySelector("#compose-body").value;
  
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });

  // Stop the form from leaving the current page
  return(false);
}

function ShowEmail (emailId, parentViewCode) {
  const emailView = document.querySelector('#email-view');
  
  fetch('/emails/' + emailId)
    .then(response => response.json())
    .then(email => {
      let buttons = '';
      emailView.innerHTML = '<b>From: </b>' + email.sender + '<br>' +
        '<b>To: </b>' + email.recipients + '<br>' +
        '<b>Subject: </b>' + email.subject + '<br>' +
        '<b>Date: </b>' + email.timestamp + '<br>';

      var replyButton = document.createElement("button");
      replyButton.setAttribute("id", "replyMail");
      replyButton.setAttribute("class", "btn btn-sm btn-outline-primary");
      replyButton.innerHTML = 'Reply';

      if (email.subject.substring(0, 4) == "Re: ") {
        replySubject = email.subject;
      } else {
        replySubject = "Re: " + email.subject;
      }

      replyBody = "On " + email.timestamp + " " + email.sender + " wrote: " + email.body;

      if (parentViewCode == 'inbox') {
        emailView.appendChild(replyButton);
        document.querySelector('#replyMail').addEventListener('click', () => compose_email(email.sender, replySubject, replyBody));

        var archiveButton = document.createElement("button");
        archiveButton.setAttribute("id", "archiveMail");
        archiveButton.setAttribute("class", "btn btn-sm btn-outline-primary");
        archiveButton.innerHTML = 'Archive';
        emailView.appendChild(archiveButton);
        document.querySelector('#archiveMail').addEventListener('click', () => compose_email(email.sender, replySubject, replyBody));

        document.querySelector('#archiveMail').addEventListener('click', () => ArchiveEmail(emailId, true));
      } else if (parentViewCode == 'archive') {
        emailView.appendChild(replyButton);
        document.querySelector('#replyMail').addEventListener('click', () => compose_email(email.sender, replySubject, replyBody));

        var unarchiveButton = document.createElement("button");
        unarchiveButton.setAttribute("id", "unarchiveMail");
        unarchiveButton.setAttribute("class", "btn btn-sm btn-outline-primary");
        unarchiveButton.innerHTML = 'Unarchive';
        emailView.appendChild(unarchiveButton);
        
        document.querySelector('#unarchiveMail').addEventListener('click', () => ArchiveEmail(emailId, false));
      }

      var delimiter = document.createElement("hr");
      emailView.appendChild(delimiter);
      var emailBody = document.createElement("p");
      emailBody.innerHTML = email.body;
      emailView.appendChild(emailBody);

      hideAllViews();
      emailView.style.display = 'block';

      // Mark email as read
      fetch('/emails/' + emailId, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      });
    });
}

function AddElement (currentView, email, elementId) {
  let backgroundColor = "white";
            
  if (email.read == true) {
    backgroundColor = "lightgrey";
  }

  var element = document.createElement("div");
  element.setAttribute("id", elementId);
  element.setAttribute("class", "emailListElement row");
  element.setAttribute("style", "background: " + backgroundColor);
  currentView.appendChild(element);

  var senderComponent = document.createElement("div");
  senderComponent.setAttribute("class", "elementComponent col-md-3 col-lg-3");
  senderComponent.innerHTML = "<b>" + email.sender + "</b>";
  element.appendChild(senderComponent);

  var subjectComponent = document.createElement("div");
  subjectComponent.setAttribute("class", "elementComponent col-md-7 col-lg-7");
  subjectComponent.innerHTML = email.subject;
  element.appendChild(subjectComponent);

  var timeComponent = document.createElement("div");
  timeComponent.setAttribute("class", "elementComponent col-md-2 col-lg-2");
  timeComponent.setAttribute("style", "color: grey");
  timeComponent.innerHTML = email.timestamp;
  element.appendChild(timeComponent);
}

function ArchiveEmail(emailId, archive) {
  fetch('/emails/' + emailId, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archive
    })
  })
  .then(response => load_mailbox('inbox'));
}