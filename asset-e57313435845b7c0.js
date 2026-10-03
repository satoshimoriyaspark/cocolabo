document.addEventListener('DOMContentLoaded', () => {
    const formSubmit = document.getElementById('formSubmit');
    const buttonSubmit = document.getElementsByClassName('btn-customform-submit')[0];
    const formCaptchaWrap = document.getElementsByClassName('form-captcha-wrap')[0];
    let result = false;

    formSubmit.setAttribute('type', 'button');
    formCaptchaWrap.innerHTML += `<div id="msgError"></div>`;

    async function callApi(tokenValue) {
        try {
            const url = document.querySelectorAll('input[name=urlValidCaptcha]')[0].value;
            const response = await fetch(url + tokenValue);
            const result = await response.json();
            return result.is_valid;
        } catch (error) {
            return false;
        }
    }

    buttonSubmit.onclick = async function () {
        if (formSubmit.getAttribute('type') === 'submit') {
            return;
        }
        const token = document.querySelectorAll('input[name=captcha_token]')[0];
        const msgErrorContent = document.getElementById('msgErrorContent');
        let classMargin = ``;
        let msg = '';
        if (token) {
            let tokenValue = token.value;
            result = await callApi(tokenValue);
            msg = 'テキストに誤りがあります';
        } else {
            result = false;
            classMargin = `u-mtsm`;
            msg = '「私はロボットではありません」の内容を回答して送信してください';
        }
        if (result) {
            msgErrorContent ? msgErrorContent.remove() : '';
            formSubmit.setAttribute('type', 'submit');
            buttonSubmit.click();
        } else {
            let html = `
              <div id="msgErrorContent" class="${classMargin}">
                <p class="has-error formInput_invalid">${msg}</p>
              </div>
           `;
            if (!formCaptchaWrap.querySelector('#msgError')) {
                formCaptchaWrap.innerHTML += `<div id="msgError"></div>`;
            }
            let msgError = document.getElementById('msgError');
            msgError.innerHTML = html;
        }
    };
});
