// for http connection
import 'package:http/http.dart' as http;
// import 'package:http/http.dart' as http;
// for stdin
import 'dart:io';

void main() async {
  await login();
  print("Good bye");
}


Future<void> login() async {
 print("===== Login =====");
// Get username and password
 stdout.write("Username: ");
 String? username = stdin.readLineSync()?.trim();
 stdout.write("Password: ");
 String? password = stdin.readLineSync()?.trim();

 if (username == null || password == null) {
    print("Incomplete input");
    return;
}

final body = {"username": username, "password": password};
final url = Uri.parse('http://localhost:3000/login');
final response = await http.post(url, body: body);
   if (response.statusCode == 200) {
      final result = response.body;
      print(result);
    } else if (response.statusCode == 401 || response.statusCode == 500) {
    final result = response.body;
    print(result);
    } else {
    print("Unknown error");
 }
}




