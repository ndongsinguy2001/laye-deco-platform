{/* Modal des identifiants */}
{showCredentials && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Compte créé avec succès !</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Voici les identifiants du journalier. Envoyez-les-lui par WhatsApp.
        </p>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center py-2 border-b dark:border-gray-600">
          <span className="font-medium text-gray-700 dark:text-gray-300">📱 Téléphone :</span>
          <span className="text-gray-800 dark:text-white font-mono">{newCredentials.phone}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b dark:border-gray-600">
          <span className="font-medium text-gray-700 dark:text-gray-300">🔑 Mot de passe :</span>
          <span className="text-gray-800 dark:text-white font-mono">{newCredentials.password}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">🔗 Lien de connexion :</span>
          <span className="text-gray-800 dark:text-white text-xs font-mono break-all">
            https://laye-deco-platform.netlify.app
          </span>
        </div>
        {newCredentials.email && (
          <div className="flex justify-between items-center py-2 border-t dark:border-gray-600">
            <span className="font-medium text-gray-700 dark:text-gray-300">📧 Email :</span>
            <span className="text-gray-800 dark:text-white font-mono">{newCredentials.email}</span>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          📱 Copiez ces identifiants et envoyez-les au journalier par WhatsApp.
          <br />
          ⚠️ Il pourra changer son mot de passe dans son profil après sa première connexion.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            const text = `📱 Téléphone: ${newCredentials.phone}\n🔑 Mot de passe: ${newCredentials.password}\n🔗 Lien: https://laye-deco-platform.netlify.app${newCredentials.email ? `\n📧 Email: ${newCredentials.email}` : ''}`;
            navigator.clipboard.writeText(text);
            toast.success('Identifiants copiés !');
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
        >
          📋 Copier tout
        </button>
        <button
          onClick={() => setShowCredentials(false)}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg"
        >
          OK
        </button>
      </div>
    </div>
  </div>
)}