var xmlParser = require("xml2json"),
	request = require("request"),
	crypto = require("crypto");

var title = process.argv[2] || "carlsberg";
var page = process.argv[3] || 1;

var awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID,
	awsSecretKey = process.env.AWS_SECRET_KEY,
	endpoint = "webservices.amazon.co.uk",
	uri = "/onca/xml",
	params = {
	    "Service": "AWSECommerceService",
	    "Operation": "ItemSearch",
	    "AWSAccessKeyId": awsAccessKeyId,
	    "AssociateTag": "httpsgithucom-21",
	    "SearchIndex": "Grocery",
	    "Keywords": "alcohol",
	    "ResponseGroup": "Images,ItemAttributes",
	    "Title": title,
	    "Sort": "relevancerank",
	    "ItemPage": page,
	    "Timestamp": (new Date).toISOString()
	},

	queryString = Object.keys(params).sort().reduce(function(arr, key) {
		return arr.concat(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
	}, []).join("&"),

	stringToSign = "GET\n" + endpoint + "\n" + uri + "\n" + queryString,
	signature = crypto.createHmac("sha256", awsSecretKey).update(stringToSign).digest("base64"),
	url = "http://" + endpoint + uri + "?" + queryString + "&Signature=" + encodeURIComponent(signature);


var callback = function (error, response, body) {

	if (!error && response.statusCode == 200) {
		var parsed = JSON.parse(xmlParser.toJson(body, {sanitize: false})),
			items = parsed.ItemSearchResponse.Items.Item;

		var results = items.reduce(function(arr, item) {

			var attrs = item.ItemAttributes,
				title = attrs.Title,
				feat = attrs.Feature,
				alcohol = null,
				i;

			for (i in feat) {
				var start = feat[i].search(/[0-9]*\.?[0-9]+%/);

				if (start != -1) {
					var end = feat[i].indexOf("%"),
						alcohol = feat[i].slice(start, end); 

					break;
				};

			};

			return alcohol ? arr.concat({ "title": title, "alcohol": alcohol }) : arr;

		}, []);


		console.log(results);
	};

};

request(url, callback);


