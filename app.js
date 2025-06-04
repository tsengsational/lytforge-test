// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Utility function to clean Angular objects
function cleanForFirebase(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => cleanForFirebase(item));
    }
    if (obj && typeof obj === 'object') {
        const cleaned = {};
        Object.keys(obj).forEach(key => {
            // Skip Angular internal properties
            if (!key.startsWith('$$')) {
                cleaned[key] = cleanForFirebase(obj[key]);
            }
        });
        return cleaned;
    }
    return obj;
}

// Create Angular module
angular.module('todoApp', ['ngRoute'])
    .controller('AuthController', ['$scope', '$timeout', function($scope, $timeout) {
        // Initialize user state
        $scope.user = null;
        $scope.authError = null;

        // Listen for auth state changes
        firebase.auth().onAuthStateChanged(function(user) {
            $timeout(function() {
                $scope.user = user;
                $scope.authError = null;
            });
        }, function(error) {
            $timeout(function() {
                $scope.authError = error.message;
                console.error('Auth state change error:', error);
            });
        });

        // Login function
        $scope.login = function() {
            $scope.authError = null;
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider)
                .then(function(result) {
                    console.log('Login successful:', result.user);
                })
                .catch(function(error) {
                    $timeout(function() {
                        $scope.authError = error.message;
                        console.error('Login error:', error);
                    });
                });
        };

        // Logout function
        $scope.logout = function() {
            firebase.auth().signOut()
                .then(function() {
                    console.log('Logout successful');
                })
                .catch(function(error) {
                    $timeout(function() {
                        $scope.authError = error.message;
                        console.error('Logout error:', error);
                    });
                });
        };
    }])
    .controller('TodoListController', ['$scope', '$timeout', function($scope, $timeout) {
        // Initialize variables
        $scope.lists = [];
        $scope.newList = {
            name: '',
            isPublic: false
        };
        $scope.newTodoItems = {};
        $scope.dbError = null;

        // Reference to Firebase database
        const db = firebase.database();
        const listsRef = db.ref('lists');

        // Load lists when user is authenticated
        $scope.$watch('user', function(user) {
            if (user) {
                // Listen for lists changes
                listsRef.on('value', function(snapshot) {
                    $timeout(function() {
                        $scope.lists = [];
                        snapshot.forEach(function(childSnapshot) {
                            const list = childSnapshot.val();
                            list.id = childSnapshot.key;
                            
                            // Check if user has access to the list
                            if (list.isPublic || 
                                list.owner === user.uid || 
                                (list.members && list.members[user.uid])) {
                                $scope.lists.push(list);
                            }
                        });
                    });
                }, function(error) {
                    $timeout(function() {
                        $scope.dbError = error.message;
                        console.error('Database error:', error);
                    });
                });
            }
        });

        // Create new list
        $scope.createList = function() {
            $scope.dbError = null;
            const list = {
                name: $scope.newList.name,
                isPublic: $scope.newList.isPublic,
                owner: $scope.user.uid,
                members: {
                    [$scope.user.uid]: true
                },
                items: [],
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            listsRef.push(cleanForFirebase(list))
                .then(() => {
                    $timeout(function() {
                        $scope.newList.name = '';
                        $scope.newList.isPublic = false;
                    });
                })
                .catch(function(error) {
                    $timeout(function() {
                        $scope.dbError = error.message;
                        console.error('Create list error:', error);
                    });
                });
        };

        // Add todo item to list
        $scope.addTodoItem = function(list) {
            $scope.dbError = null;
            const item = {
                text: $scope.newTodoItems[list.id],
                completed: false,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                createdBy: $scope.user.uid
            };

            if (!list.items) {
                list.items = [];
            }
            list.items.push(item);
            
            listsRef.child(list.id).update({
                items: cleanForFirebase(list.items)
            })
            .then(() => {
                $timeout(function() {
                    $scope.newTodoItems[list.id] = '';
                });
            })
            .catch(function(error) {
                $timeout(function() {
                    $scope.dbError = error.message;
                    console.error('Add item error:', error);
                });
            });
        };

        // Update todo item
        $scope.updateItem = function(list, item) {
            $scope.dbError = null;
            listsRef.child(list.id).update({
                items: cleanForFirebase(list.items)
            })
            .catch(function(error) {
                $timeout(function() {
                    $scope.dbError = error.message;
                    console.error('Update item error:', error);
                });
            });
        };

        // Remove todo item
        $scope.removeItem = function(list, item) {
            $scope.dbError = null;
            const index = list.items.indexOf(item);
            if (index > -1) {
                list.items.splice(index, 1);
                listsRef.child(list.id).update({
                    items: cleanForFirebase(list.items)
                })
                .catch(function(error) {
                    $timeout(function() {
                        $scope.dbError = error.message;
                        console.error('Remove item error:', error);
                    });
                });
            }
        };

        // Assign item to user
        $scope.assignItem = function(list, item) {
            $scope.dbError = null;
            const assignedTo = prompt('Enter user email to assign this item:');
            if (assignedTo) {
                item.assignedTo = assignedTo;
                listsRef.child(list.id).update({
                    items: cleanForFirebase(list.items)
                })
                .catch(function(error) {
                    $timeout(function() {
                        $scope.dbError = error.message;
                        console.error('Assign item error:', error);
                    });
                });
            }
        };
    }]); 