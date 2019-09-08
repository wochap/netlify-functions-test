const axios = require("axios");
const cheerio = require("cheerio");

// "event" has informatiom about the path, body, headers etc of the request
// "context" has information about the lambda environment and user details
// The "callback" ends the execution of the function and returns a reponse back to the caller
exports.handler = (event, context, callback) => {
  const body = JSON.parse(event.body);
  const html = decodeURIComponent(body.html);
  const $assessmentPage = cheerio.load(html);
  const formData = Array
    .from($assessmentPage("form input"))
    .reduce((result, input) => ({
      ...result,
      [input.attribs.name]: input.attribs.value
    }), {});
  const formQuery = Object.entries(formData)
    .map(field => field.join("="))
    .join("&");

  axios({
    url: "https://sierdgtt.mtc.gob.pe/Resultados",
    method: "post",
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'PostmanRuntime/7.16.3',
      'Cache-Control': 'no-cache',
      'Postman-Token': 'bd276fb9-cb1a-43fe-b622-9abdf3280a61',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'content-type': 'application/x-www-form-urlencoded',
      'Cookie': 'ASP.NET_SessionId=nvyvrpjvao54hii5t1qpm3kb',
      'Host': 'sierdgtt.mtc.gob.pe',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    },
    data: formQuery,
  }).then(response => {
    const $resultsPage = cheerio.load(response.data);
    const questions = $resultsPage("#myModal .card-box");
    const answers = Array
      .from(questions)
      .map(question => $resultsPage(question).find(".alert")[0])
      .map(answerEl => {
        const answerText = $resultsPage(answerEl).text();
        return answerText.slice(answerText.length - 1);
      });
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: JSON.stringify({
        data: answers
      })
    })
  }).catch(error => {
    console.error(error)
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: JSON.stringify({
        error: error,
      })
    })
  });
}
