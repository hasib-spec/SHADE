from typing import List, Dict, Any

def generate_sms_alerts(hotspot_cells: List[Dict[str, Any]], forecast: Dict[str, Any], target_demographic: str) -> List[Dict[str, str]]:
    """
    Produces localized, targeted SMS alert drafts in both English and Spanish.
    """
    alerts = []
    
    for cell in hotspot_cells:
        neighborhood = cell.get('neighborhood_name', 'Maryvale, Phoenix')
        peak_time = forecast.get('peak_time', '3:00 PM')
        peak_temp_c = forecast.get('peak_temp_c', 44.8)
        peak_temp_f = (peak_temp_c * 9/5) + 32
        
        nearest_cooling_center = cell.get('nearest_cooling_center', 'Maryvale Community Center')
        
        # English Draft
        msg_en = f"URGENT: Extreme Heat Alert for {neighborhood}. Tomorrow at {peak_time}: {peak_temp_c:.1f}°C / {peak_temp_f:.1f}°F. "
        msg_en += f"Seek shelter at {nearest_cooling_center}. "
        
        if target_demographic == "elderly":
            msg_en += "Check on elderly neighbors and ensure they have AC/water."
        elif target_demographic == "children":
            msg_en += "Keep children indoors and hydrated."
        else:
            msg_en += "Stay hydrated and avoid outdoor activities."
            
        # Spanish Draft
        msg_es = f"URGENTE: Alerta de Calor Extremo para {neighborhood}. Mañana a las {peak_time}: {peak_temp_c:.1f}°C / {peak_temp_f:.1f}°F. "
        msg_es += f"Busque refugio en {nearest_cooling_center}. "
        
        if target_demographic == "elderly":
            msg_es += "Controle a sus vecinos ancianos y asegúrese de que tengan aire acondicionado/agua."
        elif target_demographic == "children":
            msg_es += "Mantenga a los niños adentro e hidratados."
        else:
            msg_es += "Manténgase hidratado y evite actividades al aire libre."
            
        alerts.append({
            "cell_id": cell.get('id', 'unknown'),
            "english": msg_en,
            "spanish": msg_es
        })
        
    return alerts
