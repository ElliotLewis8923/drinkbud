var xmlParser = require("xml2json"),
	request = require("request"),
	crypto = require("crypto");

var title = process.argv[2] || "carlsberg";
var page = process.argv[3] || 1;

var urlConstructor = function(page, title) {

	var awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID,
		awsSecretKey = process.env.AWS_SECRET_KEY,
		endpoint = "webservices.amazon.co.uk",
		uri = "/onca/xml",
		params = [
	            {"AWSAccessKeyId": awsAccessKeyId},
	            {"AssociateTag": "httpsgithucom-21"},
		    {"ItemPage": page},
		    {"Keywords": "alcohol"},
	            {"Operation": "ItemSearch"},
		    {"ResponseGroup": "Images,ItemAttributes"},
	            {"SearchIndex": "Grocery"},
		    {"Service": "AWSECommerceService"},
		    {"Sort": "relevancerank"},
		    {"Timestamp": (new Date).toISOString()},
		    {"Title": title}
		],
	
		queryString = params.reduce(function(arr, pair) {
			var key = Object.keys(pair);
			return arr.concat(encodeURIComponent(key) + "=" + encodeURIComponent(pair[key]));
		}, []).join("&");
	
		stringToSign = "GET\n" + endpoint + "\n" + uri + "\n" + queryString,
		signature = crypto.createHmac("sha256", awsSecretKey).update(stringToSign).digest("base64");

		return url = "http://" + endpoint + uri + "?" + queryString + "&Signature=" + encodeURIComponent(signature);
};

var amazonRequest = function (title, callback) {
	
	var allResults = []
	var page = 1;

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
		
			allResults.push(results);
			request(url, callback);
		};

	};

	while (true) {
			
	var url = urlConstructor(page, title);
	request(url, callback);
	
	};

};


