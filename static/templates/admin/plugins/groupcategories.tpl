<form role="form" class="groupcategories-settings">
	<div class="row">
		<div class="col-sm-2 col-xs-12 settings-header">General</div>
		<div class="col-sm-10 col-xs-12">
			<!-- <p class="lead"> -->
				<!-- Adjust these settings. You can then retrieve these settings in code via: -->
				<!-- <code>meta.settings.get('groupcategories');</code> -->
			<!-- </p> -->
            <p class="lead">
                Each group will have a companion category.
            </p>
			<div class="form-group">
				<label for="category">Target category</label>
				<select id="category" name="category" title="Target category" class="form-control">
                    <option value="0"><i>Root category</i></option>
            		<!-- BEGIN categories -->
					<option value="{../cid}">{../name}</option>
            		<!-- END categories -->
				</select>
			</div>
			<div class="form-group">
				<input type="checkbox" id="enabled" name="enabled" title="Enabled">
                <label for="enabled">Automatically manage group categories</label>
			</div>
		</div>
	</div>
</form>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>
