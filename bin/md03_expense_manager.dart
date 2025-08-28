import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:io';

const baseUrl = 'http://localhost:3000';
int? currentUserId;
String? currentUsername;

Future<void> main() async {
  print('===== Login =====');
  await _login();
  if (currentUserId == null) {
    print('Good bye');
    return;
  }
  await _menuLoop();
  print('Good bye');
}

Future<void> _login() async {
  stdout.write('Username: ');
  final username = stdin.readLineSync();
  stdout.write('Password: ');
  final password = stdin.readLineSync();

  if (username == null || username.isEmpty || password == null || password.isEmpty) {
    print('Incomplete input');
    return;
  }

  final uri = Uri.parse('$baseUrl/login');
  final res = await http.post(uri, body: {'username': username, 'password': password});

  if (res.statusCode == 200) {
    final data = json.decode(res.body) as Map<String, dynamic>;
    currentUserId = data['userId'] as int?;
    currentUsername = data['username'] as String?;
  } else {
    print('Login failed: ${res.body}');
  }
}

Future<void> _menuLoop() async {
  while (true) {
    print('\n========= Expense Tracking App =========');
    print('Welcome ${currentUsername ?? ""}');
    print('1. All expenses');
    print('2. Today\'s expense');
    print('3. Search expense');
    print('4. Add new expense');
    print('5. Delete an expense');
    print('6. Exit');
    stdout.write('Choose..');
    final choice = stdin.readLineSync();

    switch (choice) {
      case '1':
        await _showAll();
        break;
      case '2':
        await _showToday();
        break;
      case '3':
        await _search();
        break;
      case '4':
        await _add();
        break;
      case '5':
        await _delete();
        break;
      case '6':
        return;
      default:
        print('Invalid choice.');
    }
  }
}

Future<void> _showAll() async {
  final uid = currentUserId;
  if (uid == null) return;

  final uri = Uri.parse('$baseUrl/expenses?userId=$uid');
  final res = await http.get(uri);

  if (res.statusCode == 200) {
    final list = json.decode(res.body) as List<dynamic>;
    print('------------ All expenses ----------');
    num total = 0;
    for (final e in list) {
      final m = e as Map<String, dynamic>;
      final id = m['id'];
      final title = m['title'];
      final amount = m['amount'];
      final paidAt = m['paid_at'];
      print('$id. $title : ${amount}฿ : $paidAt');
      if (amount is num) total += amount;
      if (amount is String) total += num.tryParse(amount) ?? 0;
    }
    print('Total expenses = ${total}฿');
  } else {
    print('Fetch failed (${res.statusCode}).');
  }
}

Future<void> _showToday() async {
  final uid = currentUserId;
  if (uid == null) return;

  final uri = Uri.parse('$baseUrl/expenses/today?userId=$uid');
  final res = await http.get(uri);

  if (res.statusCode == 200) {
    final list = json.decode(res.body) as List<dynamic>;
    print('------------ Today\'s expenses ----------');
    if (list.isEmpty) {
      print('(No expense today)');
      return;
    }
    num total = 0;
    for (final e in list) {
      final m = e as Map<String, dynamic>;
      final id = m['id'];
      final title = m['title'];
      final amount = m['amount'];
      final paidAt = m['paid_at'];
      print('$id. $title : ${amount}฿ : $paidAt');
      if (amount is num) total += amount;
      if (amount is String) total += num.tryParse(amount) ?? 0;
    }
    print('Total expenses = ${total}฿');
  } else {
    print('Fetch failed (${res.statusCode}).');
  }
}

Future<void> _search() async {
  final uid = currentUserId;
  if (uid == null) return;

  stdout.write('Item to search: ');
  final q = stdin.readLineSync() ?? '';

  final uri = Uri.parse('$baseUrl/expenses/search')
      .replace(queryParameters: {'userId': uid.toString(), 'q': q});

  final res = await http.get(uri);

  if (res.statusCode == 200) {
    final list = json.decode(res.body) as List<dynamic>;
    if (list.isEmpty) {
      print('No item contains "$q".');
      return;
    }
    for (final e in list) {
      final m = e as Map<String, dynamic>;
      print('${m['id']}. ${m['title']} : ${m['amount']}฿ : ${m['paid_at']}');
    }
  } else {
    print('Search failed (${res.statusCode}).');
  }
}

Future<void> _add() async {
  final uid = currentUserId;
  if (uid == null) return;

  stdout.write('Item: ');
  final title = stdin.readLineSync() ?? '';
  stdout.write('Paid: ');
  final amtStr = stdin.readLineSync() ?? '';
  final amount = double.tryParse(amtStr);

  if (title.isEmpty || amount == null) {
    print('Missing/invalid fields.');
    return;
  }

  final uri = Uri.parse('$baseUrl/expenses');
  final res = await http.post(uri, body: {
    'userId': uid.toString(),
    'title': title,
    'amount': amount.toString(),
  });

  if (res.statusCode == 201) {
    final data = json.decode(res.body) as Map<String, dynamic>;
    print('Inserted with id: ${data['id']}');
  } else {
    print('Create failed (${res.statusCode}).');
  }
}

Future<void> _delete() async {
  final uid = currentUserId;
  if (uid == null) return;

  stdout.write('Item id: ');
  final id = int.tryParse(stdin.readLineSync() ?? '');
  if (id == null) {
    print('Invalid id');
    return;
  }

  final uri = Uri.parse('$baseUrl/expenses/$id?userId=$uid');
  final res = await http.delete(uri);
  if (res.statusCode == 200) {
    print('Deleted.');
  } else if (res.statusCode == 404) {
    print('Not found or cannot delete.');
  } else {
    print('Delete failed (${res.statusCode}).');
  }
}