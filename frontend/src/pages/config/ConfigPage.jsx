import React, { useState, useEffect } from 'react';
import { configApi } from '../../api/config.api';
import { useConfigStore } from '../../store/configStore';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Building, FileText, Save, Trash2, Upload, Loader2, Bell, Receipt } from 'lucide-react';

const ConfigPage = () => {
  const { config, fetchConfig, updateConfig } = useConfigStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, banner: false });
  const [formData, setFormData] = useState({
    company_name: '',
    company_cuit: '',
    company_address: '',
    company_phone: '',
    pdf_footer_message: '',
    pdf_banner_validity: '',
    high_sale_limit: '',
    arca_base_url: '',
    arca_api_key: '',
    arca_env: 'testing',
    arca_punto_venta: '',
    arca_condicion_venta_default: 'Contado',
    arca_emitter_name: '',
    arca_emitter_cuit: '',
    arca_emitter_address: '',
    arca_emitter_iva_condition: '',
    prices_include_vat: 'true',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!config) return;
    setFormData({
      company_name: config.company_name || '',
      company_cuit: config.company_cuit || '',
      company_address: config.company_address || '',
      company_phone: config.company_phone || '',
      pdf_footer_message: config.pdf_footer_message || '',
      pdf_banner_validity: config.pdf_banner_validity || '',
      high_sale_limit: config.high_sale_limit || '',
      arca_base_url: config.arca_base_url || '',
      arca_api_key: config.arca_api_key || '',
      arca_env: config.arca_env || 'testing',
      arca_punto_venta: config.arca_punto_venta || '',
      arca_condicion_venta_default: config.arca_condicion_venta_default || 'Contado',
      arca_emitter_name: config.arca_emitter_name || '',
      arca_emitter_cuit: config.arca_emitter_cuit || '',
      arca_emitter_address: config.arca_emitter_address || '',
      arca_emitter_iva_condition: config.arca_emitter_iva_condition || '',
      prices_include_vat: config.prices_include_vat || 'true',
    });
  }, [config]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveText = async () => {
    setLoading(true);
    try {
      const payload = { ...formData, prices_include_vat: 'true' };
      await configApi.update(payload);
      updateConfig(payload);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('El archivo es demasiado grande (máx 5MB)');
    }

    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const response = type === 'logo' ? await configApi.uploadLogo(file) : await configApi.uploadBanner(file);
      const key = type === 'logo' ? 'sidebar_logo_path' : 'pdf_banner_path';
      updateConfig({ [key]: response.data.data.path });
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} actualizado`);
    } catch (error) {
      toast.error('Error al subir archivo');
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDeleteFile = async (type) => {
    try {
      if (type === 'logo') await configApi.deleteLogo();
      else await configApi.deleteBanner();
      const key = type === 'logo' ? 'sidebar_logo_path' : 'pdf_banner_path';
      updateConfig({ [key]: null });
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} eliminado`);
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const getFullUrl = (path) => path ? `http://localhost:3000${path}` : null;

  const renderField = (label, name, placeholder, type = 'text') => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>
      <input type={type} name={name} value={formData[name]} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder={placeholder} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configuración General</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Identidad, documentos y parámetros globales de ARCA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-primary-500" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Identidad Visual</h2>
          </div>
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Logo del Sistema (Sidebar)</label>
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                  {config.sidebar_logo_path ? <img src={getFullUrl(config.sidebar_logo_path)} alt="Logo" className="max-w-full max-h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-slate-400" />}
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="cursor-pointer bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2">
                    {uploading.logo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{config.sidebar_logo_path ? 'Cambiar Logo' : 'Subir Logo'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(event) => handleFileUpload('logo', event.target.files[0])} />
                  </label>
                  {config.sidebar_logo_path && <button onClick={() => handleDeleteFile('logo')} className="text-red-500 hover:text-red-600 text-xs font-medium flex items-center justify-center space-x-1"><Trash2 className="w-3 h-3" /><span>Eliminar actual</span></button>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Banner para Documentos PDF</label>
              <div className="space-y-3">
                <div className="aspect-[5/1] w-full rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                  {config.pdf_banner_path ? (
                    <img src={config.pdf_banner_path?.startsWith('data:') ? config.pdf_banner_path : getFullUrl(config.pdf_banner_path)} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-500">Ratio sugerido 5:1 (ej: 1000x200px)</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <label className="cursor-pointer text-primary-500 hover:text-primary-400 text-sm font-bold transition-colors flex items-center space-x-2">
                    {uploading.banner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{config.pdf_banner_path ? 'Cambiar Banner' : 'Subir Banner'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(event) => handleFileUpload('banner', event.target.files[0])} />
                  </label>
                  {config.pdf_banner_path && <button onClick={() => handleDeleteFile('banner')} className="text-red-500 hover:text-red-600 text-xs font-medium flex items-center space-x-1"><Trash2 className="w-3 h-3" /><span>Eliminar</span></button>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary-500" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Datos de la Empresa</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {renderField('Nombre / Razón Social', 'company_name', 'Nombre de tu negocio')}
            {renderField('CUIT', 'company_cuit', '00-00000000-0')}
            {renderField('Dirección', 'company_address', 'Av. Principal 123')}
            {renderField('Teléfono', 'company_phone', '+54 9...')}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center space-x-2">
          <Receipt className="w-5 h-5 text-primary-500" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Integración ARCA</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField('Base URL', 'arca_base_url', 'https://mi-ec2/facturacion')}
          {renderField('API Key', 'arca_api_key', 'Clave del microservicio')}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Ambiente</label>
            <select name="arca_env" value={formData.arca_env} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="testing">Testing</option>
              <option value="production">Producción</option>
            </select>
          </div>
          {renderField('Punto de Venta', 'arca_punto_venta', '1', 'number')}
          {renderField('Condición de Venta Default', 'arca_condicion_venta_default', 'Contado')}
          {renderField('Emisor / Razón Social', 'arca_emitter_name', 'Nombre del emisor fiscal')}
          {renderField('CUIT Emisor', 'arca_emitter_cuit', '20-00000000-0')}
          {renderField('Dirección Emisor', 'arca_emitter_address', 'Domicilio fiscal del emisor')}
          {renderField('IVA Emisor', 'arca_emitter_iva_condition', 'Responsable Inscripto')}
        </div>
        <div className="px-6 pb-6">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm text-emerald-800 dark:text-emerald-300">
            Política activa: los precios del POS se interpretan como finales con IVA 21% incluido y Chopper recalcula neto/IVA antes de enviar a ARCA.
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-primary-500" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Textos Legales y PDF</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Mensaje Pie de Página</label>
            <textarea name="pdf_footer_message" value={formData.pdf_footer_message} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Gracias por su preferencia..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Texto de Validez</label>
            <textarea name="pdf_banner_validity" value={formData.pdf_banner_validity} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Presupuesto válido por 30 días..." />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center space-x-2">
          <Bell className="w-5 h-5 text-primary-500" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Alertas y Notificaciones</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField('Límite de Venta Alta ($)', 'high_sale_limit', '10000', 'number')}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSaveText} disabled={loading} className="px-8 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center space-x-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Guardar Configuración</span>
        </button>
      </div>
    </div>
  );
};

export default ConfigPage;
